import "./style.css";
import Phaser from "phaser";
import { io, Socket } from "socket.io-client";
import Bullet from "./BulletClass";
import Player from "./Player";
import { MainMenu } from "./MainMenu";

enum GameState {
  NONE,
  START,
  WAITING,
  GAME,
  RESPAWN,
  END_GAME
}

let socket: Socket | null = null;

class MyGame extends Phaser.Scene {

  public CurrentGameState: GameState = GameState.NONE;
  mapWidth: number = 3000;
  mapHeight: number = 2000;
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
  playersSpeed: number = 800;
  constructor() {
    super("mygame");
    this.localPlayer = null;
  }

  preload() {
    this.load.image("player", "assets/player.png");
    this.load.image("bullet", "assets/bullet.png");
    this.load.image('background', 'assets/background.jpg');
  }

  ChangeGameState(newState: GameState) {
    this.CurrentGameState = newState;
    switch (newState) {
      case GameState.START: {
        this.MainMenu = new MainMenu(this);
        // socket = io("http://localhost:3000");
        break;
      }
      case GameState.GAME: {
        this.MainMenu?.toggleMenuVisibility();
        socket = io("http://10.8.64.174:3000");
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
        socket?.on("RPCSendName", (data) => {
          if (data.id === socket?.id) {
            if (this.localPlayer)
              this.localPlayer.Nickname = data.name;
            this.localPlayer?.createHealthBar();
          } else {
            let tmpPlayer = this.Players.get(data.id);
            if (tmpPlayer)
              tmpPlayer.Nickname = data.name;
            tmpPlayer?.createHealthBar();
          }
        });
        socket?.on("sendPlayersList", (data) => {
          let newData = new Map<string, { x: number; y: number; id: string, name: string }>(
            Object.entries(data)
          );

          newData.forEach((value, key) => {
            if (key !== this.localPlayer?.Owner) {
              let tmpPlayer = new Player(this, value.x, value.y, "player", value.id);
              tmpPlayer.Nickname = value.name;
              tmpPlayer.createHealthBar();
              this.Players.set(
                key,
                tmpPlayer
              );
            }
          });
        });

        socket?.on('serverSendPlayerState', (data: { id: string, x: number, y: number, direction: number }) => {
          if (this.Players.has(data.id)) {
            const player = this.Players.get(data.id);
            if (player) {
              player.targetX = data.x;
              player.targetY = data.y;
              player.lastUpdateTime = Date.now();
              player.setRotation(data.direction);
            }
          }
        });

        socket?.on("rpcPlayerFire", (data) => {
          new Bullet(this, data.playerX, data.playerY, "bullet", data.Owner).fire(data.x, data.y, data.speed);
        });

        socket?.on('RPCPlayerDead', (data) => {
          console.log('Player dead', data.id)
          if (data.id === socket?.id) {
            this.localPlayer?.destroy();
            this.localPlayer?.HealthBar?.destroy();
            this.localPlayer = null;
          }
          else {
            let tmpPlayer = this.Players.get(data.id);
            if (tmpPlayer) {
              tmpPlayer.destroy();
              tmpPlayer.HealthBar?.destroy();
              this.Players.delete(data.id);
            }
          }
        })
        socket?.on('rpcPlayerHurt', (data) => {
          if (data.PlayerId === socket?.id) {
            if (this.localPlayer) {
              this.localPlayer.ChangeHealth(data.Health);
            }
          }
          else {
            let tmpPlayer = this.Players.get(data.PlayerId);
            if (tmpPlayer) {
              tmpPlayer.ChangeHealth(data.Health);
            }
          }
        })
        socket?.on('RPCPlayerRespawn', (data) => {
          if (data.id === socket?.id) {
            this.localPlayer = new Player(this, data.x, data.y, "player", socket?.id !== undefined ? socket?.id : "");
            this.localPlayer.Nickname = data.name;
            this.localPlayer.createHealthBar();
            this.cameras.main.startFollow(this.localPlayer, true);
            this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
            return;
          }
          let tmpPlayer = new Player(this, data.x, data.y, "player", data.id);
          tmpPlayer.Nickname = data.name;
          tmpPlayer.createHealthBar();
          tmpPlayer.Owner = data.id;
          this.Players.set(
            data.id,
            tmpPlayer
          );
        });
        socket?.on("playerDisconnected", (data) => {
          let tmpPlayer = this.Players.get(data);
          if (tmpPlayer) {
            this.playersGroup?.remove(tmpPlayer);
          }

          this.Players.get(data)?.destroy();
          this.Players.get(data)?.HealthBar?.destroy();
          this.Players.delete(data);
        });

        socket?.on("playerConnected", (data) => {
          if ((this, this.localPlayer === null)) {
            socket?.emit("CMDSendName", { name: (document.querySelector('input[name="name"]') as HTMLInputElement).value });
            socket?.emit("requestPlayersList");
          }
          this.localPlayer = new Player(this, data.x, data.y, "player", socket?.id !== undefined ? socket?.id : "");
          this.cameras.main.startFollow(this.localPlayer, true);
          this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        });

        break;
      }
    }
  }

  create() {
    this.ChangeGameState(GameState.START);

    this.physics.world.setBounds(0, 0, 3000, 2000);

    const background = this.add.image(0, 0, 'background').setOrigin(0, 0).setDepth(-1);
    background.displayWidth = this.mapWidth;
    background.displayHeight = this.mapHeight;
    this.bulletsGroup = this.physics.add.group({
    });

    this.playersGroup = this.physics.add.group({
    });

    this.physics.add.overlap(this.playersGroup, this.bulletsGroup, (player, bullet) => {
      if ((bullet as Bullet).Owner !== (player as Player).Owner) {
        bullet.destroy();
        if ((player as Player).Owner === socket?.id) {
          this.playerHurt(25);
        }
      }
    });
    this.input.keyboard?.on('keydown', (event: any) => {
      if (event.key === "f") {
        this.playerFire();
      }
    });

    this.cursors = this.input?.keyboard?.createCursorKeys();

    setInterval(() => {
      if (this.localPlayer === null) {
        return;
      }
      socket?.emit("clientSendPlayerState", {
        x: this.localPlayer.x,
        y: this.localPlayer.y,
        direction: this.localPlayer.rotation
      });
    }, 50);

  }
  setPlayerName(name: string) {
    this.LocalPlayerName = name;
  }

  playerFire() {
    if (this.localPlayer !== null)
      socket?.emit("cmdPlayerFire", { x: this.playersLastLookDirection.x, y: -this.playersLastLookDirection.y, speed: 1000 });
  }

  playerHurt(damage: number) {
    socket?.emit('cmdPlayerHurt', damage);
  }

  update(time: number, delta: number): void {
    if (this.CurrentGameState === GameState.WAITING) {
      return;
    }
    //Players movement
    this.Players.forEach((player, id) => {
      if (id !== socket?.id) {  // Пропустить локального игрока
        //const timeSinceLastUpdate = Date.now() - player.lastUpdateTime;
        const extrapolatedX = player.targetX;
        const extrapolatedY = player.targetY;

        // Интерполировать между текущим положением и экстраполированным
        const newX = Phaser.Math.Interpolation.SmoothStep(0.2, player.x, extrapolatedX);
        const newY = Phaser.Math.Interpolation.SmoothStep(0.2, player.y, extrapolatedY);

        player.MovePlayer(newX, newY);
      }
    });



    this.localPlayer?.setVelocity(0);

    this.localPlayer?.AdjustHealthBarPosition();

    if (this.cursors?.left.isDown) {
      this.playersLookDirection.x = -1;
      this.localPlayer?.setVelocityX(-this.playersSpeed);
    } else if (this.cursors?.right.isDown) {
      this.playersLookDirection.x = 1;
      this.localPlayer?.setVelocityX(this.playersSpeed);
    } else {
      this.playersLookDirection.x = 0;
    }

    if (this.cursors?.up.isDown) {
      this.playersLookDirection.y = 1;
      this.localPlayer?.setVelocityY(-this.playersSpeed);
    } else if (this.cursors?.down.isDown) {
      this.playersLookDirection.y = -1;
      this.localPlayer?.setVelocityY(this.playersSpeed);
    } else {
      this.playersLookDirection.y = 0;
    }
    if (this.playersLookDirection.x !== 0 || this.playersLookDirection.y !== 0) {
      this.playersLastLookDirection = { ...this.playersLookDirection };
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
