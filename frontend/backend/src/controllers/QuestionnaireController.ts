import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Questionnaire } from '../entities/Questionnaire';
import { Question } from '../entities/Question';

export class QuestionnaireController {
  static async getByCode(req: Request, res: Response) {
    const { code } = req.params;
    const { version, lang } = req.query;

    if (!lang) {
      return res.status(400).json({ message: 'Language code is required' });
    }

    try {
      const questionnaireRepo = AppDataSource.getRepository(Questionnaire);
      const query = questionnaireRepo.createQueryBuilder('q')
        .leftJoinAndSelect('q.questions', 'question')
        .leftJoinAndSelect('question.translations', 'qt', 'qt.language_code = :lang', { lang })
        .leftJoinAndSelect('question.options', 'option')
        .leftJoinAndSelect('option.translations', 'ot', 'ot.language_code = :lang', { lang })
        .where('q.code = :code', { code })
        .orderBy('question.order', 'ASC')
        .addOrderBy('option.order', 'ASC');

      if (version) {
        query.andWhere('q.version = :version', { version });
      } else {
        query.andWhere('q.is_active = true');
      }

      const questionnaire = await query.getOne();

      if (!questionnaire) {
        return res.status(404).json({ message: 'Questionnaire not found' });
      }

      // Map to required structure
      const response = {
        id: questionnaire.id,
        code: questionnaire.code,
        version: questionnaire.version,
        language: lang,
        questions: questionnaire.questions.map(q => ({
          id: q.id,
          code: q.code,
          type: q.type,
          order: q.order,
          text: q.translations[0]?.text || q.code,
          helpText: q.translations[0]?.help_text || null,
          options: q.options.map(o => ({
            id: o.id,
            code: o.code,
            label: o.translations[0]?.label || o.code
          }))
        }))
      };

      return res.json(response);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }
}
