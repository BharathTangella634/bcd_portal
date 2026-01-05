import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { ImagingStudy } from '../entities/ImagingStudy';
import { AuthRequest } from '../middleware/auth';
import { Between } from 'typeorm';

export class TechnologistController {
  static async getImagingStudies(req: AuthRequest, res: Response) {
    const { modality, fromDate, toDate, page = 1, limit = 10 } = req.query;
    const { hospitalId } = req.user!;

    try {
      const studyRepo = AppDataSource.getRepository(ImagingStudy);
      const query = studyRepo.createQueryBuilder('study')
        .leftJoinAndSelect('study.patient', 'patient')
        .leftJoinAndSelect('study.encounter', 'encounter')
        .where('patient.hospital_id = :hospitalId', { hospitalId });

      if (modality) {
        query.andWhere('study.modality = :modality', { modality });
      }

      if (fromDate && toDate) {
        query.andWhere('study.created_at BETWEEN :fromDate AND :toDate', { fromDate, toDate });
      }

      const [studies, total] = await query
        .orderBy('study.created_at', 'DESC')
        .take(Number(limit))
        .skip((Number(page) - 1) * Number(limit))
        .getManyAndCount();

      return res.json({ studies, total, page, limit });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getStudyById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    
    try {
      const studyRepo = AppDataSource.getRepository(ImagingStudy);
      const study = await studyRepo.findOne({
        where: { id: parseInt(id) },
        relations: ['patient', 'encounter']
      });

      if (!study) {
        return res.status(404).json({ message: 'Imaging study not found' });
      }

      // Placeholder for viewer URL
      const viewerUrl = `http://viewer-placeholder.com/study/${study.study_instance_uid}`;

      return res.json({ ...study, viewerUrl });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
