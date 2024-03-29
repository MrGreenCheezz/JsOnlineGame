import "./style.css";
import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import Bullet from "./BulletClass";
import Player from "./Player";
import { MainMenu } from "./MainMenu";

enum GameState {
  NONE,
  START,
  GAME,
  RESPAWN,
  END_GAME
}

let socket: Socket | null = null;

class MyGame extends Phaser.Scene {
  public CurrentGameState: GameState = GameState.NONE;
  public LocalPlayerName: string = "";
  private MainMenu: MainMenu | null = null;
  localPlayer: Player | null;
  bulletsGroup: Phaser.Physics.Arcade.Group | undefined;
  playersGroup: Phaser.Physics.Arcade.Group | undefined;
  Players: Map<string, Player> =
    new Map();
  cursors: Phaser.Types.Input.Keyboard.CursorKeys | null | undefined;
  playersLookDirection: { x: number; y: number } = { x: 0, y: 0 };
  playersLastLookDirection: { x: number; y: number } = { x: 0, y: 0 };
  playersSpeed: number = 250;
  constructor() {
    super("mygame");
    this.localPlayer = null;
  }

  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("bullet", "assets/bullet.png");
  }

  ChangeGameState(newState: GameState) {
    this.CurrentGameState = newState;
    switch (newState) {
      case GameState.START:{
        this.MainMenu = new MainMenu(this);
       // socket = io("http://localhost:3000");
        break;
      }
      case GameState.GAME:{
        this.MainMenu?.toggleMenuVisibility();
        socket = io("http://localhost:3000");
        break;
      }
    }
  }

  create() {
    this.ChangeGameState(GameState.START);

    this.bulletsGroup = this.physics.add.group({
    });

    this.playersGroup = this.physics.add.group({
    });

    this.physics.add.overlap(this.playersGroup, this.bulletsGroup, (player, bullet) => {
      if((bullet as Bullet).Owner !== (player as Player).Owner){
        bullet.destroy();
        if((player as Player).Owner === socket?.id){
          this.playerHurt(25);
        }
      }
    });
    this.input.keyboard?.on('keydown', (event : any) => {
          if(event.key === "f"){
              this.playerFire();
          }
    });

    this.cursors = this.input?.keyboard?.createCursorKeys();
    socket?.on("playerConnected", (data) => {
      if ((this, this.localPlayer === null)) {
        socket?.emit("requestPlayersList");
      }
      this.localPlayer = new Player(this, data.x, data.y, "player", socket?.id !== undefined ? socket?.id : "");
    });

    socket?.on("newPlayerConnected", (data) => {
      if (data.id === socket?.id) {
        return;
      }
      let tmpPlayer = new Player(this, data.x, data.y, "player", data.id);
      this.Players.set(
        data.id,
        tmpPlayer
      );
    });
    socket?.on("sendPlayersList", (data) => {
      let newData = new Map<string, { x: number; y: number; id: string}>(
        Object.entries(data)
      );
      console.log(newData);
      newData.forEach((value, key) => {
        if (key !== this.localPlayer?.Owner) { 
        let tmpPlayer = new Player(this, value.x, value.y, "player", value.id);
        this.Players.set(
          key,
          tmpPlayer
        );
        }
      });
    });

    socket?.on('serverSendPlayerState', (data :  {id: string, x: number, y: number, direction: number}) => {
      if(this.Players.has(data.id)){
        this.Players.get(data.id)?.MovePlayer(data.x, data.y);
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

    socket?.on("rpcPlayerFire", (data) => {
      new Bullet(this, data.playerX, data.playerY, "bullet", data.Owner).fire(data.x, data.y, data.speed);
    });

    socket?.on('rpcPlayerDead', (data) => {
      console.log("Player death");
      if(data.id === socket?.id){
        this.localPlayer?.destroy();
        this.localPlayer?.HealthBar?.destroy();
        this.localPlayer = null;
      }
      else{
        let tmpPlayer = this.Players.get(data.id);
        if(tmpPlayer){
          tmpPlayer.destroy();
          tmpPlayer.HealthBar?.destroy();
          this.Players.delete(data.id);
        }
      }
    })
    socket?.on('rpcPlayerHurt', (data) =>{
      if(data.PlayerId === socket?.id){
        if(this.localPlayer){
          this.localPlayer.ChangeHealth(data.Health);
        }
      }
      else{
        let tmpPlayer = this.Players.get(data.PlayerId);
        if(tmpPlayer){
          tmpPlayer.ChangeHealth(data.Health);
        }
      }
    })

    socket?.on("playerDisconnected", (data) => {
      let tmpPlayer = this.Players.get(data);
      if(tmpPlayer){
        this.playersGroup?.remove(tmpPlayer);
      }
      console.log(data);
      this.Players.get(data)?.destroy();
      this.Players.get(data)?.HealthBar?.destroy();
      this.Players.delete(data);
    });

  }

  playerFire(){
    if(this.localPlayer !== null)
    socket?.emit("cmdPlayerFire", {x: this.playersLastLookDirection.x, y: -this.playersLastLookDirection.y, speed: 1000});
  }

  playerHurt(damage: number){
    socket?.emit('cmdPlayerHurt', damage);
  }

  update(time: number, delta: number): void {
    this.localPlayer?.setVelocity(0);
     
    this.localPlayer?.AdjustHealthBarPosition();

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
      this.playersLastLookDirection = {...this.playersLookDirection};
    this.localPlayer?.setRotation(Math.atan2(this.playersLookDirection.x, this.playersLookDirection.y));
    }
    
  }

 
}
export { MyGame };

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
