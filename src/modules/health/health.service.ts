import { HealthRepository } from "./health.repository";
import { HealthRecordInput, VaccinationInput, NutritionInput } from "./health.dto";

export class HealthService {
  private repository: HealthRepository;

  constructor() {
    this.repository = new HealthRepository();
  }

  // ── CREATE ────────────────────────────────────────────────────

  async createHealthRecord(dto: HealthRecordInput, actorId: string, uploadedFiles: Express.Multer.File[]) {
    return this.repository.createHealthRecord(dto, actorId, uploadedFiles);
  }

  async addVaccination(dto: VaccinationInput, actorId: string, uploadedFiles: Express.Multer.File[]) {
    return this.repository.createVaccination(dto, actorId, uploadedFiles);
  }

  async addNutritionRecord(dto: NutritionInput, actorId: string) {
    const bmi = this._calcBmi(dto.heightCm, dto.weightKg);
    return this.repository.createNutritionRecord(dto, bmi, actorId);
  }

  // ── READ ──────────────────────────────────────────────────────

  async getHealthHistory(childId: string) {
    return this.repository.findHealthHistoryByChild(childId);
  }

  async getVaccinations(childId: string) {
    return this.repository.findVaccinationsByChild(childId);
  }

  async getNutritionHistory(childId: string) {
    return this.repository.findNutritionHistoryByChild(childId);
  }

  // ── UPDATE ────────────────────────────────────────────────────

  async updateHealthRecord(id: string, dto: Partial<HealthRecordInput>, actorId: string, uploadedFiles: Express.Multer.File[]) {
    return this.repository.updateHealthRecord(id, dto, actorId, uploadedFiles);
  }

  async updateVaccination(id: string, dto: Partial<VaccinationInput>, actorId: string, uploadedFiles: Express.Multer.File[]) {
    return this.repository.updateVaccination(id, dto, actorId, uploadedFiles);
  }

  async updateNutritionRecord(id: string, dto: Partial<NutritionInput>, actorId: string) {
    const bmi = this._calcBmi(dto.heightCm, dto.weightKg);
    return this.repository.updateNutritionRecord(id, dto, bmi, actorId);
  }

  // ── DELETE ────────────────────────────────────────────────────

  async deleteHealthRecord(id: string, actorId: string) {
    return this.repository.deleteHealthRecord(id, actorId);
  }

  async deleteVaccination(id: string, actorId: string) {
    return this.repository.deleteVaccination(id, actorId);
  }

  async deleteNutritionRecord(id: string, actorId: string) {
    return this.repository.deleteNutritionRecord(id, actorId);
  }

  async deleteFile(fileId: string, context: string, actorId: string) {
    return this.repository.deleteFile(fileId, context, actorId);
  }

  // ── HELPERS ───────────────────────────────────────────────────

  private _calcBmi(heightCm?: number, weightKg?: number): number | null {
    if (!heightCm || !weightKg) return null;
    const hm = heightCm / 100;
    return parseFloat((weightKg / (hm * hm)).toFixed(2));
  }
}