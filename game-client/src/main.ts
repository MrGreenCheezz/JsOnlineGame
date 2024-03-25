import "./style.css";
import Phaser from "phaser";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

class MyGame extends Phaser.Scene {
  localPlayer: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody | null;
  Players: Map<string, Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> =
    new Map();
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | null | undefined;
  playersLookDirection: { x: number; y: number } = { x: 0, y: 0 };
  playersSpeed: number = 100;
  constructor() {
    super("mygame");
    this.localPlayer = null;
  }

  preload() {
    this.load.image("player", "assets/player.png");
  }

  create() {
    socket = io("http://localhost:3000");
    this.cursors = this.input?.keyboard?.createCursorKeys();
    socket.on("playerConnected", (data) => {
      if ((this, this.localPlayer === null)) {
        socket?.emit("requestPlayersList");
      }
      this.localPlayer = this.physics.add.sprite(data.x, data.y, "player");
      this.localPlayer.setScale(0.1);
    });

    socket.on("newPlayerConnected", (data) => {
      if (data.id === socket?.id) {
        return;
      }
      let tmpPlayer = this.physics.add.sprite(data.x, data.y, "player");
        tmpPlayer.setScale(0.1);
      this.Players.set(
        data.id,
        tmpPlayer
      );
    });
    socket.on("sendPlayersList", (data) => {
      let newData = new Map<string, { x: number; y: number }>(
        Object.entries(data)
      );
      newData.forEach((value, key) => {
        if (key === socket?.id) {
          return;
        }
        let tmpPlayer = this.physics.add.sprite(value.x, value.y, "player");
        tmpPlayer.setScale(0.1);
        this.Players.set(
          key,
          tmpPlayer
        );
      });
    });

    socket.on('serverSendPlayerState', (data :  {id: string, x: number, y: number, direction: number}) => {
      if(this.Players.has(data.id)){
        this.Players.get(data.id)?.setPosition(data.x, data.y);
        this.Players.get(data.id)?.setRotation(data.direction);
      }
    });

    setInterval(() =>{
      if (this.localPlayer === null) {
        return;
      }
      socket?.emit("clientSendPlayerState", {
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        direction: this.localPlayer.rotation
      });
    }, 50);

    socket.on("playerDisconnected", (data) => {
      console.log(data);
      this.Players.get(data)?.destroy();
      this.Players.delete(data);
    });
  }

  update(time: number, delta: number): void {
    this.localPlayer?.setVelocity(0);

    if (this.cursors?.left.isDown) {
      this.playersLookDirection.x = -1;
      this.localPlayer?.setVelocityX(-this.playersSpeed);
    } else if (this.cursors?.right.isDown) {
      this.playersLookDirection.x = 1;
      this.localPlayer?.setVelocityX(this.playersSpeed);
    }else{
      this.playersLookDirection.x = 0;
    }

    if (this.cursors?.up.isDown) {
      this.playersLookDirection.y = 1;
      this.localPlayer?.setVelocityY(-this.playersSpeed);
    } else if (this.cursors?.down.isDown) {
      this.playersLookDirection.y = -1;
      this.localPlayer?.setVelocityY(this.playersSpeed);
    }else{
      this.playersLookDirection.y = 0;
    }
    if(this.playersLookDirection.x !== 0 || this.playersLookDirection.y !== 0){
    this.localPlayer?.setRotation(Math.atan2(this.playersLookDirection.x, this.playersLookDirection.y));
    }
  }

 
}

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
    },
  },
  scene: MyGame,
};

new Phaser.Game(config);
