import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Encounter, EncounterStatus } from '../entities/Encounter';
import { ClinicalNote } from '../entities/ClinicalNote';
import { ResponseEntity } from '../entities/Response';
import { AuthRequest } from '../middleware/auth';
import { Between, IsNull } from 'typeorm';

export class DoctorController {
  static async getEncounters(req: AuthRequest, res: Response) {
    const { status, fromDate, toDate, patientId, page = 1, limit = 10 } = req.query;
    const { hospitalId } = req.user!;

    try {
      const encounterRepo = AppDataSource.getRepository(Encounter);
      const where: any = { hospital_id: hospitalId };

      if (status) where.status = status;
      if (patientId) where.patient_id = patientId;
      if (fromDate && toDate) {
        where.created_at = Between(new Date(fromDate as string), new Date(toDate as string));
      }

      const [encounters, total] = await encounterRepo.findAndCount({
        where,
        relations: ['patient'],
        order: { created_at: 'DESC' },
        take: Number(limit),
        skip: (Number(page) - 1) * Number(limit),
      });

      return res.json({ encounters, total, page, limit });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async addClinicalNote(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { noteText } = req.body;
    const { id: doctorId } = req.user!;

    try {
      const noteRepo = AppDataSource.getRepository(ClinicalNote);
      const note = noteRepo.create({
        encounter_id: parseInt(id),
        doctor_id: doctorId,
        note_text: noteText,
      });
      await noteRepo.save(note);
      return res.status(201).json(note);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Placeholder for file upload
  static async uploadFile(req: AuthRequest, res: Response) {
    // In a real app, use multer and upload to Cloud Storage
    // For now, we'll just mock the metadata
    return res.status(200).json({ message: 'File uploaded (mocked)' });
  }
}
