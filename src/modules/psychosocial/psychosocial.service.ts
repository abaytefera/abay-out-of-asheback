import { PsychosocialRepository } from "./psychosocial.repository";
import { SessionCreateInput, SessionUpdateInput, TbriCreateInput, TbriUpdateInput } from "./psychosocial.dto";
import { AppError } from "../../utils/AppError";

export class PsychosocialService {
  private repository: PsychosocialRepository;

  constructor() {
    this.repository = new PsychosocialRepository();
  }

  // ── Sessions ────────────────────────────────────────────────────────────

  async logSession(dto: SessionCreateInput, actorId: string) {
    return this.repository.createSession(dto, actorId);
  }

  async getSessionsHistory(childId: string) {
    return this.repository.findSessionsByChildId(childId);
  }

  async editSession(id: string, dto: SessionUpdateInput, actorId: string) {
    const session = await this.repository.findSessionById(id);
    if (!session) throw new AppError("Session not found", 404);
    return this.repository.updateSession(id, dto, actorId);
  }

  async removeSession(id: string, actorId: string) {
    const session = await this.repository.findSessionById(id);
    if (!session) throw new AppError("Session not found", 404);
    return this.repository.deleteSession(id, actorId);
  }

  // ── TBRI ────────────────────────────────────────────────────────────────

  async logTBRIActivity(dto: TbriCreateInput, actorId: string) {
    return this.repository.createTBRI(dto, actorId);
  }

  async getTBRIHistory(childId: string) {
    return this.repository.findTBRIActivitiesByChildId(childId);
  }

  async editTBRIActivity(id: string, dto: TbriUpdateInput, actorId: string) {
    const activity = await this.repository.findTBRIById(id);
    if (!activity) throw new AppError("TBRI activity not found", 404);
    return this.repository.updateTBRI(id, dto, actorId);
  }

  async removeTBRIActivity(id: string, actorId: string) {
    const activity = await this.repository.findTBRIById(id);
    if (!activity) throw new AppError("TBRI activity not found", 404);
    return this.repository.deleteTBRI(id, actorId);
  }
}