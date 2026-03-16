export type AIProgressCallback = (report: any) => void;

class AIEngine {
  private static instance: AIEngine;
  private engine: any | null = null;
  private isInitializing: boolean = false;
  private progressCallbacks: Set<AIProgressCallback> = new Set();
  private lastReport: any | null = null;

  private constructor() {}

  public static getInstance(): AIEngine {
    if (!AIEngine.instance) {
      AIEngine.instance = new AIEngine();
    }
    return AIEngine.instance;
  }

  public addProgressCallback(cb: AIProgressCallback) {
    this.progressCallbacks.add(cb);
    if (this.lastReport) cb(this.lastReport);
  }

  public removeProgressCallback(cb: AIProgressCallback) {
    this.progressCallbacks.delete(cb);
  }

  public async init(model: string = 'Llama-3-8B-Instruct-q4f32_1-MLC'): Promise<any> {
    if (this.engine) return this.engine;
    if (this.isInitializing) {
      return new Promise((resolve) => {
        const check = setInterval(() => {
          if (this.engine) {
            clearInterval(check);
            resolve(this.engine);
          }
        }, 100);
      });
    }

    this.isInitializing = true;
    try {
      const { CreateMLCEngine } = await import('@mlc-ai/web-llm');
      const engine = await CreateMLCEngine(model, {
        initProgressCallback: (report) => {
          this.lastReport = report;
          this.progressCallbacks.forEach(cb => cb(report));
        }
      });
      this.engine = engine;
      return engine;
    } finally {
      this.isInitializing = false;
    }
  }

  public getEngine(): any | null {
    return this.engine;
  }
}

export const aiEngine = AIEngine.getInstance();
