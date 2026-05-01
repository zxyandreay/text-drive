import Phaser from "phaser";
import { UiFactory } from "./ui/UiFactory";
import { UiTheme } from "./ui/UiTheme";

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

    this.cameras.main.setBackgroundColor(UiTheme.colors.bg);

    const brand = this.add
      .text(width / 2, 86, "TEXT DRIVE", {
        fontFamily: UiTheme.fontDisplay,
        fontSize: UiTheme.sizes.menuTitleSm,
        fontStyle: "bold",
        color: UiTheme.colors.title,
        stroke: UiTheme.colors.bg,
        strokeThickness: 4
      })
      .setOrigin(0.5);
    if (typeof (brand as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing === "function") {
      (brand as Phaser.GameObjects.Text & { setLetterSpacing: (n: number) => void }).setLetterSpacing(6);
    }

    this.add
      .text(width / 2, 152, "Ending", {
        fontFamily: UiTheme.fontFamily,
        fontSize: "24px",
        color: UiTheme.colors.muted
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height / 2, finalMessage, {
        fontFamily: UiTheme.fontFamily,
        fontSize: "24px",
        color: "#f8fafc",
        align: "center",
        wordWrap: { width: 720 }
      })
      .setOrigin(0.5);

    UiFactory.createButton(this, width / 2, height - 92, "Main Menu", () => {
      this.scene.start("MainMenuScene");
    }, { width: 220, height: 50, backgroundColor: 0x334155 });
  }
}
