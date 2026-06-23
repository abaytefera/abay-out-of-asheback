// ============================================================
// School Types — matches Prisma Schoolname model
// ============================================================
 
export type SchoolWon = "PRIVATE" | "GOVERMENT";
 
export interface CreateSchoolDto {
  name: string;
  type: SchoolWon;
}
 
export interface UpdateSchoolDto {
  name?: string;
  type?: SchoolWon;
}
 
export interface SchoolResponse {
  id: string;
  name: string;
  type: SchoolWon;
}
 
export interface SchoolListQuery {
  search?: string;
  type?: SchoolWon | "ALL";
}