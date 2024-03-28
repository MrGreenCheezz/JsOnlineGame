import Phaser from "phaser";
import {MyGame} from "./main.ts";
import HealthBar from "./HpBar.ts";

class Player extends Phaser.Physics.Arcade.Sprite
{
 Owner : string = "";
 public Health : number = 100;
 public HealthBar : HealthBar | undefined;
 constructor(scene: MyGame, x: number | undefined = 0, y: number | undefined = 0, texture: string, owner: string){  
    super(scene, x, y, texture);
    this.Owner = owner;
    scene.add.existing(this);
    this.setScale(0.1);
    //scene.physics.add.existing(this);
    scene.playersGroup?.add(this);
    this.HealthBar = new HealthBar(scene, this.x, this.y, this.Health);
 }

   AdjustHealthBarPosition(){
      if(this.HealthBar){
         this.HealthBar.Move(this.x - 37, this.y - 40);
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