import { Response } from 'express';
import { AppDataSource } from '../config/database';
import { Encounter, EncounterStatus } from '../entities/Encounter';
import { Patient } from '../entities/Patient';
import { Response as ResponseEntity } from '../entities/Response';
import { AuthRequest } from '../middleware/auth';
import { UserRole } from '../entities/User';

export class EncounterController {
  static async create(req: AuthRequest, res: Response) {
    const { patient, questionnaireCode } = req.body;
    const { hospitalId } = req.user!;

    try {
      const patientRepo = AppDataSource.getRepository(Patient);
      let patientEntity = await patientRepo.findOneBy({ 
        hospital_id: hospitalId, 
        external_id: patient.externalId 
      });

      if (!patientEntity) {
        patientEntity = patientRepo.create({
          hospital_id: hospitalId,
          external_id: patient.externalId,
          name: patient.name,
          dob: new Date(patient.dob),
          sex: patient.sex,
        });
        await patientRepo.save(patientEntity);
      }

      const encounterRepo = AppDataSource.getRepository(Encounter);
      const encounter = encounterRepo.create({
        patient_id: patientEntity.id,
        hospital_id: hospitalId,
        status: EncounterStatus.DRAFT,
      });

      await encounterRepo.save(encounter);

      return res.status(201).json({ id: encounter.id });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async upsertResponses(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { responses, isDraft } = req.body;
    const { id: userId } = req.user!;

    try {
      const encounterRepo = AppDataSource.getRepository(Encounter);
      const encounter = await encounterRepo.findOneBy({ id: parseInt(id) });

      if (!encounter) {
        return res.status(404).json({ message: 'Encounter not found' });
      }

      const responseRepo = AppDataSource.getRepository(ResponseEntity);
      
      for (const resp of responses) {
        let responseEntity = await responseRepo.findOneBy({
          encounter_id: encounter.id,
          question_id: resp.questionId,
        });

        if (responseEntity) {
          responseEntity.value_json = resp.value;
          responseEntity.updated_by_user_id = userId;
        } else {
          responseEntity = responseRepo.create({
            encounter_id: encounter.id,
            question_id: resp.questionId,
            value_json: resp.value,
            created_by_user_id: userId,
          });
        }
        await responseRepo.save(responseEntity);
      }

      if (isDraft === false) {
        encounter.status = EncounterStatus.SUBMITTED;
        await encounterRepo.save(encounter);
      }

      return res.json({ message: 'Responses saved successfully' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getById(req: AuthRequest, res: Response) {
    const { id } = req.params;
    const { hospitalId } = req.user!;

    try {
      const encounterRepo = AppDataSource.getRepository(Encounter);
      const encounter = await encounterRepo.findOne({
        where: { id: parseInt(id), hospital_id: hospitalId },
        relations: ['patient', 'responses', 'responses.question']
      });

      if (!encounter) {
        return res.status(404).json({ message: 'Encounter not found' });
      }

      // Add other relations manually or via query builder if needed (notes, files, imaging)
      // For now, keeping it simple
      
      return res.json(encounter);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
