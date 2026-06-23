import { Response } from "express";
import { SponsorshipService } from "./sponsorship.service";
import { AuthRequest } from "../../types";

const service = new SponsorshipService();

const wrapper = (fn: (req: AuthRequest, res: Response) => Promise<void>) =>
  (req: AuthRequest, res: Response, next: any) => fn(req, res).catch(next);

export const listSponsors = wrapper(async (req, res) => {
  const result = await service.listSponsors(req.query);
  res.status(200).json(result);
});

export const getSponsor = wrapper(async (req, res) => {
  const result = await service.getSponsorById(req.params.id);
  res.status(200).json(result);
});

export const createSponsor = wrapper(async (req, res) => {
  const result = await service.registerSponsor(req.body, req.user!.id, req.files as any);
  res.status(201).json({ success: true, message: "Sponsor registered", data: result });
});

export const updateSponsor = wrapper(async (req, res) => {
  const result = await service.updateSponsorDetails(req.params.id, req.body, req.user!.id);
  res.status(200).json(result);
});

export const deleteSponsor = wrapper(async (req, res) => {
  await service.removeSponsor(req.params.id, req.user!.id);
  res.status(204).send();
});

export const createSponsorship = wrapper(async (req, res) => {
  const result = await service.initiateSponsorship(req.body, req.user!.id);
  res.status(201).json({ success: true, message: "Sponsorship created", data: result });
});

export const endSponsorship = wrapper(async (req, res) => {
  const result = await service.concludeSponsorship(req.params.id, req.body, req.user!.id);
  res.status(200).json({ success: true, message: "Sponsorship ended", data: result });
});

export const getByChild = wrapper(async (req, res) => {
  const result = await service.fetchSponsorshipsByChild(req.params.childId);
  res.status(200).json(result);
});

export const createReport = wrapper(async (req, res) => {
  const result = await service.attachDonorReport(req.params.id, req.body, req.user!.id, req.files as any);
  res.status(201).json(result);
});

export const deleteDonorReportFile = wrapper(async (req, res) => {
  await service.removeDonorReportFile(req.params.fileId, req.user!.id);
  res.status(204).send();
});

export const uploadPhotos = wrapper(async (req, res) => {
  const result = await service.addSponsorPhotos(req.params.id, req.user!.id, req.files as any);
  res.status(200).json(result);
});

export const deletePhoto = wrapper(async (req, res) => {
  await service.removeSponsorPhoto(req.params.photoId, req.user!.id);
  res.status(204).send();
});