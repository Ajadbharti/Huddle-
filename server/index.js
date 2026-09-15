const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fetch = require('node-fetch');

const DAILY_API_KEY = "fd079e5d6b0d83317dd67f4317be74ba3a9d5041c3cad61bd8bc8e42b919236e";

// Ludo game state - room-wise store karenge
const ludoGames = {};

const START_POSITIONS = { red: 0, green: 13, yellow: 26, blue: 39 };
const COLORS = ["red", "green", "yellow", "blue"];

function createLudoState() {
  const players = {};
  COLORS.forEach((color) => {
    players[color] = {
      tokens: [-1, -1, -1, -1], // -1 = yard me
    };
  });
  return {
    players,
    turnIndex: 0, // COLORS array me se kiski turn hai
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
    console.log(`Video ${action} in room ${roomCode} at ${time}s`);
  });

  socket.on('game-move', ({ roomCode, boxIndex, symbol }) => {
    io.to(roomCode).emit('game-update', { boxIndex, symbol });
    console.log(`Move in room ${roomCode}: box ${boxIndex} = ${symbol}`);
  });

  socket.on('game-reset', ({ roomCode }) => {
    io.to(roomCode).emit('game-reset-update');
  });

  // ---- Ludo ----
  socket.on('ludo-join', ({ roomCode }) => {
    if (!ludoGames[roomCode]) {
      ludoGames[roomCode] = createLudoState();
    }

    const game = ludoGames[roomCode];

    // Agar already koi color assign hai is socket ko, to dobara mat do
    const alreadyJoined = game.joinedColors.find((j) => j.socketId === socket.id);
    if (alreadyJoined) {
      socket.emit('ludo-state', game);
      return;
    }

    // Khaali color dhundo
    const takenColors = game.joinedColors.map((j) => j.color);
    const availableColor = COLORS.find((c) => !takenColors.includes(c));

    if (!availableColor) {
      socket.emit('ludo-full');
      return;
    }

    game.joinedColors.push({ socketId: socket.id, color: availableColor });
    socket.emit('ludo-your-color', availableColor);
    io.to(roomCode).emit('ludo-state', game);

    console.log(`${socket.id} joined Ludo as ${availableColor} in room ${roomCode}`);
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
      // Room already exist karta hai (dusra user already bana chuka), uska URL nikaal lo
      const existingUrl = `https://ajju.daily.co.daily.co/huddle-${roomCode}`;
      io.to(roomCode).emit('call-ready', existingUrl);
    }
  } catch (err) {
    console.error('Daily room creation failed:', err);
  }
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

  // Agar koi move possible nahi hai, turn seedha agle ko de do
  if (!hasTokenOutside && !canOpenNew) {
    game.turnIndex = (game.turnIndex + 1) % COLORS.length;
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
    // Yard se bahar sirf 6 pe hi nikal sakta hai
    if (game.diceValue !== 6) return;
    tokens[tokenIndex] = START_POSITIONS[currentColor];
  } else if (currentPos !== 58) {
    // Normal move
    tokens[tokenIndex] = Math.min(currentPos + game.diceValue, 58);
  } else {
    return; // already home
  }

  // Agar dice 6 nahi tha, turn agle ko do
  if (game.diceValue !== 6) {
    game.turnIndex = (game.turnIndex + 1) % COLORS.length;
  }
  game.diceValue = null;

  io.to(roomCode).emit('ludo-state', game);
  console.log(`${currentColor} moved token ${tokenIndex} to ${tokens[tokenIndex]}`);
});

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});