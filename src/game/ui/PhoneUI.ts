import Phaser from "phaser";
import type { PhoneLayout } from "./GameplayLayout";
import { UiTheme } from "./UiTheme";
import { layoutTypedCellsWithExpectedGeometry, wrapMonospaceStringToLines } from "./typingHighlightLayout";
import {
  createPartnerBubbleRow,
  createPlayerBubbleRow,
  createTypingRow
} from "./ChatBubbleRow";

const INPUT_INNER_PAD = 14;
const HINT_ALPHA_STRONG = 0.55;
const HINT_ALPHA_FADED = 0.27;
const LABEL_TO_TYPED_GAP = 8;
const PANEL_TOP_PAD = 12;
const THREAD_GAP_ABOVE_INPUT = 10;

type ChatHistoryEntry = { kind: "partner" | "player"; body: string };

export class PhoneUI {
  private readonly scene: Phaser.Scene;
  private readonly container: Phaser.GameObjects.Container;
  private readonly frame: Phaser.GameObjects.Rectangle;
  private readonly headerBar: Phaser.GameObjects.Rectangle;
  private readonly headerText: Phaser.GameObjects.Text;
  private readonly threadClipRoot: Phaser.GameObjects.Container;
  private readonly threadViewportMaskGraphics: Phaser.GameObjects.Graphics;
  private readonly threadContent: Phaser.GameObjects.Container;
  private threadViewportGeometryMask: Phaser.Display.Masks.GeometryMask | null = null;
  private readonly inputPanel: Phaser.GameObjects.Rectangle;
  private readonly inputLabel: Phaser.GameObjects.Text;
  private readonly replyHintContainer: Phaser.GameObjects.Container;
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
  private replyHintSource = "";

  private chatHistory: ChatHistoryEntry[] = [];
  private threadCursorY = 0;
  private threadViewportH = 0;
  private typingRowContainer: Phaser.GameObjects.Container | null = null;
  private typingRowHeight = 0;

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

    this.threadClipRoot = scene.add.container(0, 0);
    this.threadViewportMaskGraphics = scene.add.graphics();
    this.threadViewportMaskGraphics.setVisible(false);
    this.threadContent = scene.add.container(0, 0);
    this.threadClipRoot.addAt(this.threadViewportMaskGraphics, 0);
    this.threadClipRoot.add(this.threadContent);

    this.inputPanel = scene.add.rectangle(0, 0, 1, 1, 0x1e293b, 0.94);
    this.inputPanel.setStrokeStyle(1, 0x475569, 0.75);

    this.inputLabel = scene.add
      .text(0, 0, "your reply", {
        fontFamily: UiTheme.fontFamily,
        fontSize: UiTheme.sizes.small,
        color: UiTheme.colors.accent
      })
      .setOrigin(0, 0);

    this.replyHintContainer = scene.add.container(0, 0);
    this.replyHintContainer.setAlpha(0);

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
      this.threadClipRoot,
      this.inputPanel,
      this.replyHintContainer,
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
    const halfH = height * 0.5;
    const padX = 10;
    const innerW = width - padX * 2;
    const headerH = 40;
    const panelInnerW = innerW - 4;

    const panelLeft = centerX - panelInnerW * 0.5;
    this.contentLeft = panelLeft + INPUT_INNER_PAD;
    this.contentWidth = Math.max(80, panelInnerW - INPUT_INNER_PAD * 2);

    this.frame.setPosition(centerX, centerY);
    this.frame.setSize(width, height);

    const headerTop = centerY - halfH + 8;
    this.headerBar.setPosition(centerX, headerTop + headerH * 0.5);
    this.headerBar.setSize(innerW, headerH);

    this.headerText.setPosition(this.contentLeft, headerTop + 7);

    const threadTop = headerTop + headerH + 8;

    const inputH = Phaser.Math.Clamp(Math.round(height * 0.28), 120, 168);
    const inputTop = centerY + halfH - inputH - padX - 28;
    this.threadViewportH = Math.max(48, inputTop - threadTop - THREAD_GAP_ABOVE_INPUT);

    this.threadClipRoot.setPosition(this.contentLeft, threadTop);

    this.applyThreadViewportMask();

    this.inputPanel.setPosition(centerX, inputTop + inputH * 0.5);
    this.inputPanel.setSize(panelInnerW, inputH);

    this.inputLabel.setPosition(this.contentLeft, inputTop + PANEL_TOP_PAD);

    const labelBottom = this.inputLabel.y + this.inputLabel.height;
    this.typedAreaY = labelBottom + LABEL_TO_TYPED_GAP;

    this.replyHintContainer.setPosition(this.contentLeft, this.typedAreaY);

    this.typedLineContainer.setPosition(this.contentLeft, this.typedAreaY);

    this.statusText.setPosition(this.contentLeft, inputTop + inputH - 26);

    this.vibrationOverlay.setPosition(centerX, centerY);
    this.vibrationOverlay.setSize(width - 8, height - 8);

    this.refreshMonoMetrics();
    this.rebuildThreadFromHistory();
    if (this.replyHintSource.length > 0) {
      this.rebuildHintLines();
    }
    this.rebuildTypedDisplay();
  }

  /** Clips thread bubbles to the viewport in threadClipRoot local space (scroll uses threadContent.y). */
  private applyThreadViewportMask(): void {
    const w = this.contentWidth;
    const h = this.threadViewportH;
    const g = this.threadViewportMaskGraphics;
    g.clear();
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, w, h);
    if (!this.threadViewportGeometryMask) {
      this.threadViewportGeometryMask = g.createGeometryMask();
      this.threadContent.setMask(this.threadViewportGeometryMask);
    }
  }

  private scrollThreadToBottom(): void {
    const extent = this.threadCursorY + this.typingRowHeight;
    this.threadContent.setY(Math.min(0, this.threadViewportH - extent));
  }

  private removeTypingIndicator(): void {
    if (this.typingRowContainer) {
      this.threadContent.remove(this.typingRowContainer, true);
      this.typingRowContainer = null;
      this.typingRowHeight = 0;
    }
  }

  private rebuildThreadFromHistory(): void {
    this.removeTypingIndicator();
    this.threadContent.removeAll(true);
    this.threadCursorY = 0;
    const tw = this.contentWidth;
    for (const e of this.chatHistory) {
      const row =
        e.kind === "partner"
          ? createPartnerBubbleRow(this.scene, e.body, tw)
          : createPlayerBubbleRow(this.scene, e.body, tw);
      row.container.setPosition(0, this.threadCursorY);
      this.threadContent.add(row.container);
      this.threadCursorY += row.height;
    }
    this.scrollThreadToBottom();
  }

  public clearThread(): void {
    this.clearReplyHint();
    this.chatHistory = [];
    this.removeTypingIndicator();
    this.threadContent.removeAll(true);
    this.threadCursorY = 0;
    this.scrollThreadToBottom();
  }

  /** Last partner bubble body in thread order (normalized). */
  public getLastPartnerMessageBody(): string | null {
    for (let i = this.chatHistory.length - 1; i >= 0; i--) {
      const e = this.chatHistory[i];
      if (e.kind === "partner") {
        return e.body;
      }
    }
    return null;
  }

  public appendPartnerMessage(body: string): void {
    this.removeTypingIndicator();
    const norm = body.trim().toLowerCase();
    this.chatHistory.push({ kind: "partner", body: norm });
    const row = createPartnerBubbleRow(this.scene, norm, this.contentWidth);
    row.container.setPosition(0, this.threadCursorY);
    this.threadContent.add(row.container);
    this.threadCursorY += row.height;
    this.scrollThreadToBottom();
  }

  public appendPlayerMessage(body: string): void {
    const norm = body.trim().toLowerCase();
    this.chatHistory.push({ kind: "player", body: norm });
    const row = createPlayerBubbleRow(this.scene, norm, this.contentWidth);
    row.container.setPosition(0, this.threadCursorY);
    this.threadContent.add(row.container);
    this.threadCursorY += row.height;
    this.scrollThreadToBottom();
  }

  public setTypingIndicator(visible: boolean): void {
    if (!visible) {
      this.removeTypingIndicator();
      this.scrollThreadToBottom();
      return;
    }
    this.removeTypingIndicator();
    const row = createTypingRow(this.scene, this.contentWidth);
    this.typingRowContainer = row.container;
    this.typingRowHeight = row.height;
    row.container.setPosition(0, this.threadCursorY);
    this.threadContent.add(row.container);
    this.scrollThreadToBottom();
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

  private rebuildHintLines(): void {
    this.replyHintContainer.removeAll(true);
    if (this.replyHintSource.length === 0 || this.monoCharW <= 0 || this.contentWidth <= 0) {
      return;
    }
    const lines = wrapMonospaceStringToLines(this.replyHintSource, this.monoCharW, this.contentWidth);
    const monoStyle = {
      fontFamily: "Consolas, monospace",
      fontSize: UiTheme.sizes.phoneMono,
      color: UiTheme.colors.replyHint
    };
    for (let r = 0; r < lines.length; r++) {
      const lineText = this.scene.add
        .text(0, r * this.monoLineH, lines[r], monoStyle)
        .setOrigin(0, 0);
      this.replyHintContainer.add(lineText);
    }
  }

  public setDepth(depth: number): void {
    this.container.setDepth(depth);
  }

  public clearReplyHint(): void {
    this.scene.tweens.killTweensOf(this.replyHintContainer);
    this.replyHintContainer.removeAll(true);
    this.replyHintSource = "";
    this.replyHintContainer.setAlpha(0);
    this.typingFadeCommitted = false;
  }

  public setReplyHint(expected: string): void {
    this.scene.tweens.killTweensOf(this.replyHintContainer);
    this.replyHintSource = expected;
    this.rebuildHintLines();
    this.replyHintContainer.setAlpha(HINT_ALPHA_STRONG);
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
      if (this.replyHintSource.length > 0) {
        this.scene.tweens.killTweensOf(this.replyHintContainer);
        this.replyHintContainer.setAlpha(HINT_ALPHA_STRONG);
      }
    } else if (!this.typingFadeCommitted && this.replyHintSource.length > 0) {
      this.typingFadeCommitted = true;
      this.scene.tweens.killTweensOf(this.replyHintContainer);
      this.scene.tweens.add({
        targets: this.replyHintContainer,
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

    const placed = layoutTypedCellsWithExpectedGeometry(
      this.displayTyped,
      this.displayExpected,
      {
        ok: UiTheme.colors.typedCorrect,
        bad: UiTheme.colors.typedWrong
      },
      this.monoCharW,
      this.monoLineH,
      this.contentWidth
    );
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
    this.clearThread();
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
