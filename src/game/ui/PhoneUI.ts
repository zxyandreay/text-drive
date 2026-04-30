import Phaser from "phaser";
import type { PhoneLayout } from "./GameplayLayout";
import { UiTheme } from "./UiTheme";
import { buildCharCells, layoutCellsAsPlacedSegments } from "./typingHighlightLayout";

const INPUT_INNER_PAD = 14;
const HINT_ALPHA_STRONG = 0.55;
const HINT_ALPHA_FADED = 0.27;
const LABEL_TO_TYPED_GAP = 8;
const PANEL_TOP_PAD = 12;
export class PhoneUI {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly headerBar: Phaser.GameObjects.Rectangle;
  private readonly headerText: Phaser.GameObjects.Text;
  private readonly incomingText: Phaser.GameObjects.Text;
  private readonly inputPanel: Phaser.GameObjects.Rectangle;
  private readonly inputLabel: Phaser.GameObjects.Text;
  private readonly replyHintText: Phaser.GameObjects.Text;
  private readonly typedLineContainer: Phaser.GameObjects.Container;
  private readonly statusText: Phaser.GameObjects.Text;
  private readonly vibrationOverlay: Phaser.GameObjects.Rectangle;

  private contentLeft = 0;
  private contentWidth = 0;
  private typedAreaY = 0;
  private monoCharW = 0;
  private monoLineH = 20;
  private displayTyped = "";
  private displayExpected = "";
  private typingFadeCommitted = false;

  constructor(scene: Phaser.Scene, initial: PhoneLayout) {
    this.scene = scene;

    this.frame = scene.add.rectangle(0, 0, 1, 1, 0x0b1220, 0.92);
    this.frame.setStrokeStyle(1, 0x334155, 0.9);

    this.headerBar = scene.add.rectangle(0, 0, 1, 1, 0x111827, 1);
    this.headerBar.setStrokeStyle(1, 0x1e293b, 0.6);

    this.headerText = scene.add
      .text(0, 0, "messages", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.phoneHeader,
        color: UiTheme.colors.title
      })
      .setOrigin(0, 0);

    this.incomingText = scene.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.phoneBody,
        color: UiTheme.colors.accent,
        wordWrap: { width: 280 }
      })
      .setOrigin(0, 0);

    this.inputPanel = scene.add.rectangle(0, 0, 1, 1, 0x1e293b, 0.94);
    this.inputPanel.setStrokeStyle(1, 0x475569, 0.75);

    this.inputLabel = scene.add
      .text(0, 0, "your reply", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.accent
      })
      .setOrigin(0, 0);

    this.replyHintText = scene.add
      .text(0, 0, "", {
        fontFamily: "Consolas, monospace",
        fontSize: UiTheme.sizes.phoneMono,
        color: UiTheme.colors.replyHint,
        wordWrap: { width: 280 }
      })
      .setOrigin(0, 0);
    this.replyHintText.setAlpha(0);

    this.typedLineContainer = scene.add.container(0, 0);

    this.vibrationOverlay = scene.add.rectangle(0, 0, 1, 1, 0xf8fafc, 0);

    this.statusText = scene.add
      .text(0, 0, "", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.muted
      })
      .setOrigin(0, 0);

    this.container = scene.add.container(0, 0, [
      this.frame,
      this.headerBar,
      this.headerText,
      this.incomingText,
      this.inputPanel,
      this.replyHintText,
      this.typedLineContainer,
      this.inputLabel,
      this.statusText,
      this.vibrationOverlay
    ]);
    this.container.setDepth(20);

    this.applyLayout(initial);
  }

  public applyLayout(phone: PhoneLayout): void {
    const { centerX, centerY, width, height } = phone;
    const halfW = width * 0.5;
    const halfH = height * 0.5;
    const padX = 10;
    const innerW = width - padX * 2;
    const headerH = 40;
    const panelInnerW = innerW - 4;

    const panelLeft = centerX - panelInnerW * 0.5;
    this.contentLeft = panelLeft + INPUT_INNER_PAD;
    this.contentWidth = Math.max(80, panelInnerW - INPUT_INNER_PAD * 2);
    const frameContentRight = centerX + halfW - padX;
    const messageWrapW = Math.max(160, frameContentRight - this.contentLeft - INPUT_INNER_PAD);

    this.frame.setPosition(centerX, centerY);
    this.frame.setSize(width, height);

    const headerTop = centerY - halfH + 8;
    this.headerBar.setPosition(centerX, headerTop + headerH * 0.5);
    this.headerBar.setSize(innerW, headerH);

    this.headerText.setPosition(this.contentLeft, headerTop + 7);

    const incomingY = headerTop + headerH + 10;
    this.incomingText.setPosition(this.contentLeft, incomingY);
    this.incomingText.setWordWrapWidth(messageWrapW, true);

    const inputH = Phaser.Math.Clamp(Math.round(height * 0.28), 120, 168);
    const inputTop = centerY + halfH - inputH - padX - 28;
    this.inputPanel.setPosition(centerX, inputTop + inputH * 0.5);
    this.inputPanel.setSize(panelInnerW, inputH);

    this.inputLabel.setPosition(this.contentLeft, inputTop + PANEL_TOP_PAD);

    const labelBottom = this.inputLabel.y + this.inputLabel.height;
    this.typedAreaY = labelBottom + LABEL_TO_TYPED_GAP;

    this.replyHintText.setPosition(this.contentLeft, this.typedAreaY);
    this.replyHintText.setWordWrapWidth(this.contentWidth, true);

    this.typedLineContainer.setPosition(this.contentLeft, this.typedAreaY);

    this.statusText.setPosition(this.contentLeft, inputTop + inputH - 26);

    this.vibrationOverlay.setPosition(centerX, centerY);
    this.vibrationOverlay.setSize(width - 8, height - 8);

    this.refreshMonoMetrics();
    this.rebuildTypedDisplay();
  }

  private refreshMonoMetrics(): void {
    const t = this.scene.add.text(-10000, -10000, "M", {
      fontFamily: "Consolas, monospace",
      fontSize: UiTheme.sizes.phoneMono
    });
    this.monoCharW = Math.max(1, t.width);
    this.monoLineH = Math.ceil(t.height * 1.18);
    t.destroy();
  }

  public setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  public showIncoming(body: string): void {
    this.incomingText.setText(body);
  }

  public clearReplyHint(): void {
    this.scene.tweens.killTweensOf(this.replyHintText);
    this.replyHintText.setText("");
    this.replyHintText.setAlpha(0);
    this.typingFadeCommitted = false;
  }

  public setReplyHint(expected: string): void {
    this.scene.tweens.killTweensOf(this.replyHintText);
    this.replyHintText.setText(expected);
    this.replyHintText.setAlpha(HINT_ALPHA_STRONG);
    this.typingFadeCommitted = false;
  }

  /**
   * Updates the colored typed line and optional hint fade. `expected` is the raw reply string for highlighting.
   */
  public refreshTypedDisplay(typed: string, expected: string): void {
    this.displayTyped = typed;
    this.displayExpected = expected;

    if (typed.length === 0) {
      this.typingFadeCommitted = false;
      if (this.replyHintText.text.length > 0) {
        this.scene.tweens.killTweensOf(this.replyHintText);
        this.replyHintText.setAlpha(HINT_ALPHA_STRONG);
      }
    } else if (!this.typingFadeCommitted && this.replyHintText.text.length > 0) {
      this.typingFadeCommitted = true;
      this.scene.tweens.killTweensOf(this.replyHintText);
      this.scene.tweens.add({
        targets: this.replyHintText,
        alpha: HINT_ALPHA_FADED,
        duration: 320,
        ease: "Sine.easeOut"
      });
    }

    this.rebuildTypedDisplay();
  }

  private rebuildTypedDisplay(): void {
    this.typedLineContainer.removeAll(true);

    if (this.displayTyped.length === 0) {
      const cursor = this.scene.add
        .text(0, 0, "_", {
          fontFamily: "Consolas, monospace",
          fontSize: UiTheme.sizes.phoneMono,
          color: UiTheme.colors.typedCursor
        })
        .setOrigin(0, 0);
      this.typedLineContainer.add(cursor);
      return;
    }

    const cells = buildCharCells(this.displayTyped, this.displayExpected, {
      ok: UiTheme.colors.typedCorrect,
      bad: UiTheme.colors.typedWrong
    });
    const placed = layoutCellsAsPlacedSegments(cells, this.monoCharW, this.monoLineH, this.contentWidth);
    for (const seg of placed) {
      const t = this.scene.add
        .text(seg.x, seg.y, seg.text, {
          fontFamily: "Consolas, monospace",
          fontSize: UiTheme.sizes.phoneMono,
          color: seg.color
        })
        .setOrigin(0, 0);
      this.typedLineContainer.add(t);
    }
  }

  /** Clears thread until the first real prompt (e.g. during level intro). */
  public setIdleBeforeConversation(): void {
    this.incomingText.setText("");
    this.clearReplyHint();
    this.displayTyped = "";
    this.displayExpected = "";
    this.rebuildTypedDisplay();
    this.statusText.setText("messages appear after you continue");
    this.statusText.setColor(UiTheme.colors.muted);
  }

  public setStatus(message: string, color: string = UiTheme.colors.muted): void {
    this.statusText.setText(message);
    this.statusText.setColor(color);
  }

  public vibrate(durationSeconds: number): void {
    this.scene.tweens.killTweensOf(this.container);
    this.scene.tweens.killTweensOf(this.vibrationOverlay);

    this.scene.tweens.add({
      targets: this.container,
      x: { from: -5, to: 5 },
      duration: 40,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 40),
      onComplete: () => {
        this.container.x = 0;
      }
    });

    this.scene.tweens.add({
      targets: this.vibrationOverlay,
      alpha: { from: 0.18, to: 0 },
      duration: 72,
      yoyo: true,
      repeat: Math.floor((durationSeconds * 1000) / 72)
    });
  }
}
