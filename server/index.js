const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = require('node-fetch');

const DAILY_API_KEY = "YAHAN_APNI_DAILY_API_KEY_DAALO";

const ludoGames = {};

const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };
const COLORS = ["red", "green", "yellow", "blue"];

function getNextActiveTurn(game) {
  const joinedColorNames = game.joinedColors.map((j) => j.color);
  let next = (game.turnIndex + 1) % COLORS.length;
  let attempts = 0;

  while (!joinedColorNames.includes(COLORS[next]) && attempts < 4) {
    next = (next + 1) % COLORS.length;
    attempts++;
  }
  return next;
}

function createLudoState() {
  const players = {};
  COLORS.forEach((color) => {
    players[color] = {
      tokens: [-1, -1, -1, -1],
    };
  });
  return {
    players,
    turnIndex: 0,
    diceValue: null,
    joinedColors: [],
  };
}

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.get('/', (req, res) => {
  res.send('Huddle server is running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create-room', () => {
    const roomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
    socket.join(roomCode);
    socket.emit('room-created', roomCode);
    console.log(`Room created: ${roomCode} by ${socket.id}`);
  });

  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    socket.emit('room-joined', roomCode);
    io.to(roomCode).emit('user-joined', socket.id);
    console.log(`${socket.id} joined room: ${roomCode}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.roomCode).emit('receive-message', data);
    console.log(`Message (${data.type || 'text'}) in ${data.roomCode} from ${data.sender}`);
  });

  socket.on('video-action', ({ roomCode, action, time }) => {
    socket.to(roomCode).emit('video-sync', { action, time });
  });

  socket.on('game-move', ({ roomCode, boxIndex, symbol }) => {
    io.to(roomCode).emit('game-update', { boxIndex, symbol });
  });

  socket.on('game-reset', ({ roomCode }) => {
    io.to(roomCode).emit('game-reset-update');
  });

  // ---- Ludo ----

  socket.on('ludo-check-room', ({ roomCode }) => {
    if (!ludoGames[roomCode]) {
      ludoGames[roomCode] = createLudoState();
    }
    const game = ludoGames[roomCode];
    const takenColors = game.joinedColors.map((j) => j.color);
    socket.emit('ludo-room-info', { takenColors });
  });

  socket.on('ludo-join', ({ roomCode, color }) => {
    if (!ludoGames[roomCode]) {
      ludoGames[roomCode] = createLudoState();
    }
    const game = ludoGames[roomCode];

    const alreadyJoined = game.joinedColors.find((j) => j.socketId === socket.id);
    if (alreadyJoined) {
      socket.emit('ludo-your-color', alreadyJoined.color);
      socket.emit('ludo-state', game);
      return;
    }

    const takenColors = game.joinedColors.map((j) => j.color);

    if (!COLORS.includes(color) || takenColors.includes(color)) {
      socket.emit('ludo-color-taken', { color });
      return;
    }

    game.joinedColors.push({ socketId: socket.id, color });

    const joinedNames = game.joinedColors.map((j) => j.color);
    if (!joinedNames.includes(COLORS[game.turnIndex])) {
      game.turnIndex = COLORS.indexOf(color);
    }

    socket.join(`ludo-${roomCode}`);
    socket.emit('ludo-your-color', color);
    io.to(roomCode).emit('ludo-state', game);

    console.log(`${socket.id} joined Ludo as ${color} in room ${roomCode}`);
  });

  socket.on('ludo-roll-dice', ({ roomCode }) => {
    const game = ludoGames[roomCode];
    if (!game) return;

    const currentColor = COLORS[game.turnIndex];
    const playerEntry = game.joinedColors.find((j) => j.color === currentColor);

    if (!playerEntry || playerEntry.socketId !== socket.id) {
      return;
    }

    const diceValue = Math.floor(Math.random() * 6) + 1;
    game.diceValue = diceValue;

    const tokens = game.players[currentColor].tokens;
    const hasTokenOutside = tokens.some((pos) => pos !== -1 && pos !== 58);
    const canOpenNew = diceValue === 6 && tokens.includes(-1);

    if (!hasTokenOutside && !canOpenNew) {
      game.turnIndex = getNextActiveTurn(game);
      game.diceValue = null;
    }

    io.to(roomCode).emit('ludo-state', game);
    console.log(`${currentColor} rolled ${diceValue} in room ${roomCode}`);
  });

  socket.on('ludo-move-token', ({ roomCode, tokenIndex }) => {
    const game = ludoGames[roomCode];
    if (!game || game.diceValue === null) return;

    const currentColor = COLORS[game.turnIndex];
    const playerEntry = game.joinedColors.find((j) => j.color === currentColor);
    if (!playerEntry || playerEntry.socketId !== socket.id) return;

    const tokens = game.players[currentColor].tokens;
    const currentPos = tokens[tokenIndex];

    if (currentPos === -1) {
      if (game.diceValue !== 6) return;
      tokens[tokenIndex] = START_POSITIONS[currentColor];
    } else if (currentPos !== 58) {
      tokens[tokenIndex] = Math.min(currentPos + game.diceValue, 58);

      const newPos = tokens[tokenIndex];
      const safePositions = [0, 13, 26, 39];

      if (newPos < 52 && !safePositions.includes(newPos)) {
        COLORS.forEach((otherColor) => {
          if (otherColor === currentColor) return;
          const otherTokens = game.players[otherColor].tokens;
          otherTokens.forEach((otherPos, otherIndex) => {
            if (otherPos === newPos) {
              otherTokens[otherIndex] = -1;
              console.log(`${currentColor} captured ${otherColor}'s token!`);
            }
          });
        });
      }
    } else {
      return;
    }

    const allHome = tokens.every((pos) => pos === 58);
    if (allHome) {
      io.to(roomCode).emit('ludo-winner', currentColor);
      console.log(`${currentColor} WON the game in room ${roomCode}!`);
    }

    if (game.diceValue !== 6) {
      game.turnIndex = getNextActiveTurn(game);
    }
    game.diceValue = null;

    io.to(roomCode).emit('ludo-state', game);
    console.log(`${currentColor} moved token ${tokenIndex} to ${tokens[tokenIndex]}`);
  });

  socket.on('create-call', async ({ roomCode }) => {
    try {
      const response = await fetch('https://api.daily.co/v1/rooms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `huddle-${roomCode}`,
          properties: {
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
          },
        }),
      });

      const data = await response.json();

      if (data.url) {
        io.to(roomCode).emit('call-ready', data.url);
      } else if (data.error === 'invalid-request-error') {
        const existingUrl = `https://YOUR_DAILY_DOMAIN.daily.co/huddle-${roomCode}`;
        io.to(roomCode).emit('call-ready', existingUrl);
      }
    } catch (err) {
      console.error('Daily room creation failed:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});