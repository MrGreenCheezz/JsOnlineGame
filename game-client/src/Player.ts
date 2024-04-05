import Phaser from "phaser";
import {MyGame} from "./main.ts";
import HealthBar from "./HpBar.ts";

class Player extends Phaser.Physics.Arcade.Sprite
{
 Owner : string = "";
 public Nickname : string | undefined = "";
 public Health : number = 100;
 public lastUpdateTime : number = 0;
 public targetX : number = 0;
 public targetY : number = 0;
 private MyScene : MyGame | undefined;
 public HealthBar : HealthBar | undefined;
 constructor(scene: MyGame, x: number | undefined = 0, y: number | undefined = 0, texture: string, owner: string){  
    super(scene, x, y, texture);
    this.MyScene = scene;
    this.targetX = x;
    this.targetY = y;
    this.Owner = owner;
    scene.add.existing(this);
    this.setScale(0.1);
    //scene.physics.add.existing(this);
    scene.playersGroup?.add(this);
    this.setCollideWorldBounds(true);
    
 }

   AdjustHealthBarPosition(){
      if(this.HealthBar){
         this.HealthBar.Move(this.x - 37, this.y - 40);
      }
   }
   createHealthBar(){
      if (this.MyScene) {
         this.HealthBar = new HealthBar(this.MyScene, this.x, this.y, this.Health, 75, 10, this.Nickname);
      }
   }

   MovePlayer(x: number, y: number){
      this.x = x;
      this.y = y;
      this.AdjustHealthBarPosition();
   }

   ChangeHealth(amount: number){
      this.Health = amount;
      this.HealthBar?.setValue(this.Health);
   }

   MakeDead(){
      this.HealthBar?.destroy();
      this.destroy();
   }


}

export default Player;