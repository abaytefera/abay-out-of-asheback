import { HomeVisitRepository, ActorContext } from "./home-visit.repository";
import { HomeVisitInput, HomeVisitUpdateInput } from "./home-visit.dto";
import { AppError } from "../../utils/AppError";

export class HomeVisitService {
  private repository = new HomeVisitRepository();
  // Notifications + audit logging now live inside the repository, per-transaction.

  // ── Create ────────────────────────────────────────────────────────────────
  async createVisit(dto: HomeVisitInput, actor: ActorContext, files: Express.Multer.File[]) {
    return this.repository.create(dto, actor, files);
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async deleteVisit(id: string, actor: ActorContext) {
    const visit = await this.repository.findById(id);
    if (!visit) throw new AppError("Home visit record not found", 404);
    return this.repository.deleteWithFiles(visit as any, actor);
  }

  // ── List by child ─────────────────────────────────────────────────────────
  async getVisitsByChild(childId: string) {
    return this.repository.findManyByChild(childId);
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  async getDashboardData() {
    const today        = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const [completed, overdue, upcoming] =
      await this.repository.getDashboardMetrics(sevenDaysAgo, today, nextWeek);

    return {
      completedLast7Days: completed,
      overdueFollowUps:   overdue,
      upcomingVisits:     upcoming,
    };
  }

  // ── Mark follow-up done ───────────────────────────────────────────────────
  async markFollowUpAsDone(id: string, actor: ActorContext) {
    const visit = await this.repository.findById(id);
    if (!visit) throw new AppError("Home visit record not found", 404);
    return this.repository.updateFollowUpStatus(id, true, actor);
  }

  // ── Update ────────────────────────────────────────────────────────────────
  async updateVisit(id: string, dto: HomeVisitUpdateInput, files: Express.Multer.File[], actor: ActorContext) {
    const visit = await this.repository.findById(id);
    if (!visit) throw new AppError("Home visit record not found", 404);
    return this.repository.update(id, dto, files, actor);
  }

  // ── Delete photo ──────────────────────────────────────────────────────────
  async deletePhoto(visitId: string, photoId: string, actor: ActorContext) {
    const visit = await this.repository.findById(visitId);
    if (!visit) throw new AppError("Home visit not found", 404);
    const photo = await this.repository.findPhoto(photoId);
    if (!photo || photo.homeVisitId !== visitId)
      throw new AppError("Photo not found on this visit", 404);
    return this.repository.deletePhoto(photoId, actor);
  }
}