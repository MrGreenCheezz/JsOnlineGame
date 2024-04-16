const { Console } = require('console');
const http = require('http');
const socketIo = require('socket.io');

// Создаем HTTP сервер
const server = http.createServer((req, res) => {
    res.end('Сервер работает');
});

let players = new Map();
let playerRespawnTime = 5000;

// Подключаем socket.io к серверу
const io = socketIo(server,{
    cors:{
    origin: "*", // Разрешить доступ для всех доменов
    methods: ["GET", "POST"] // Разрешенные методы HTTP
    }
});

let playersScores = new Map();

// Обработка подключения нового клиента
io.on('connection', (socket) => {
    console.log('Новое подключение:', socket.id);

    let player = {
        id: socket.id,
        Health: 100,
        x: Math.random() * 800,
        y: Math.random() * 600,
        direction: {x: 0, y: 0},
        name: 'Player'

    };
    players.set(socket.id, player);
    socket.emit('playerConnected', player);
    socket.emit('RPCSendScores',  Object.fromEntries(playersScores));
    socket.broadcast.emit('newPlayerConnected', player);
    // Обработка события, отправленного клиентом
    socket.on('requestPlayersList', () =>{
        socket.emit('sendPlayersList', Object.fromEntries(players));
    })

    socket.on('CMDSendName', (data)=>{
        let player = players.get(socket.id);
        player.name = data.name;
        if(!playersScores.has(data.name)){
            playersScores.set(data.name, 0);
        }
        io.emit('RPCSendName', {id: socket.id, name: data.name});
        console.log(playersScores);
    })

    socket.on('cmdPlayerHurt', (data) => {
        let hurtedPlayer = players.get(socket.id);
        if(hurtedPlayer){
            hurtedPlayer.Health -= data.damageAmount;
            if(hurtedPlayer.Health <= 0){
                let tmpPlayer = hurtedPlayer;
                io.emit('RPCPlayerDead', {id: socket.id});
                if(playersScores.get(players.get(data.dealer).name) !== undefined){
                    playersScores.set(players.get(data.dealer).name, playersScores.get(players.get(data.dealer).name) + 1);
                }
                console.log(playersScores.get(players.get(data.dealer).name));
                socket.emit("RPCChangePlayerScore",{name: players.get(data.dealer).name, score: playersScores.get(players.get(data.dealer).name)})
                players.delete(socket.id);
                
                setTimeout(() => {
                    tmpPlayer.Health = 100;
                    tmpPlayer.x = Math.random() * 800;
                    tmpPlayer.y = Math.random() * 600;
                    players.set(socket.id, tmpPlayer);
                    io.emit('RPCPlayerRespawn', tmpPlayer);
                }, playerRespawnTime);
            }else{
                io.emit('rpcPlayerHurt', {Health: hurtedPlayer.Health, PlayerId: socket.id});
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
