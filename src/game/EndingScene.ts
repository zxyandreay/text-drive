import Phaser from "phaser";

type EndingSceneData = {
  finalMessage?: string;
};

export class EndingScene extends Phaser.Scene {
  constructor() {
    super("EndingScene");
  }

  create(data: EndingSceneData): void {
    const { width, height } = this.scale;
    const finalMessage =
      data.finalMessage ??
      "You reached the hospital parking lot.\nThe phone finally stops vibrating.\nSilence feels heavier than speed.";

    this.cameras.main.setBackgroundColor("#020617");

    this.add
      .text(width / 2, 86, "TEXT DRIVE", {
        fontFamily: "Arial",
        fontSize: "44px",
        color: "#e2e8f0"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, 152, "Ending", {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#94a3b8"
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, finalMessage, {
        fontFamily: "Arial",
        fontSize: "24px",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: 720 }
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height - 70, "Press R to restart", {
        fontFamily: "Arial",
        fontSize: "18px",
        color: "#93c5fd"
      })
      .setOrigin(0.5);

    this.input.keyboard?.once("keydown", (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "r") {
        this.scene.start("GameScene");
      }
    });
  }
}
