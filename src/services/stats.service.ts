import { StatsModel } from '../models/stats.model.js';

export class StatsService {
  private statsModel = new StatsModel();

  async overview(threshold?: number): Promise<any> {
    const safeThreshold = Math.min(Math.max(Number(threshold ?? 10), 0), 1000);
    return this.statsModel.overview(safeThreshold);
  }
}
