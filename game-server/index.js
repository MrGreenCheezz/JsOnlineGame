const http = require('http');
const socketIo = require('socket.io');

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    res.end('Сервер работает');
});

let players = new Map();

// Подключаем socket.io к серверу
const io = socketIo(server,{
    cors:{
    origin: "*", // Разрешить доступ для всех доменов
    methods: ["GET", "POST"] // Разрешенные методы HTTP
    }
});

// Обработка подключения нового клиента
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    let player = {
        id: socket.id,
        Health: 100,
        x: Math.random() * 800,
        y: Math.random() * 600,
        direction: {x: 0, y: 0},

    };
    players.set(socket.id, player);
    socket.emit('playerConnected', player);
    socket.broadcast.emit('newPlayerConnected', player);
    // Обработка события, отправленного клиентом
    socket.on('requestPlayersList', () =>{
        socket.emit('sendPlayersList', Object.fromEntries(players));
    })

    socket.on('cmdPlayerHurt', (data) => {
        let hurtedPlayer = players.get(socket.id);
        if(hurtedPlayer){
            hurtedPlayer.Health -= data;
            if(hurtedPlayer.Health <= 0){
                players.delete(socket.id);
                io.emit('rpcPlayerDead', {id: socket.id});
            }else{
                io.emit('rpcPlayerHurt', {id: data.id, Health: hurtedPlayer.Health});
            }          
        }
    
    })

    socket.on('cmdPlayerFire', (data) =>{
        let player = players.get(socket.id);
        io.emit('rpcPlayerFire', {playerX : player.x, playerY : player.y, x : data.x, y : data.y, speed : data.speed, Owner: socket.id});
    });

    socket.on('clientSendPlayerState',(data)=>{
         players.set(socket.id, {
        ...players.get(socket.id),
        id: socket.id,
        x: data.x,
        y: data.y,
        direction: data.direction
    });
        socket.broadcast.emit('serverSendPlayerState', {id: socket.id, x: data.x, y: data.y, direction: data.direction})
    })

    // Обработка отключения клиента
    socket.on('disconnect', () => {
        console.log('Клиент отключился:', socket.id);
        players.delete(socket.id);
        socket.broadcast.emit('playerDisconnected', socket.id);
    });
});

// Запуск сервера
const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
