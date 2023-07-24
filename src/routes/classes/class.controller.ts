import { Request, Response } from 'express'
import { pool } from '../../connection'
import { BadRequestError, NotFoundError } from '../../errors'
import { StatusCodes } from 'http-status-codes'
import { z } from 'zod'
import { ClassReqBodySchema } from './class-req-body.schema'

export async function findMany(req: Request, res: Response) {
  const query = `
    SELECT course_cycle.id, course_cycle.description, course_cycle.start_date, course_cycle.end_date, course_cycle.open_for_enrollment, course_cycle.course_code, branch_office.name as branch_name, course.name as course_name
    FROM course_cycle
    INNER JOIN branch_office
    ON course_cycle.branch_id = branch_office.id
    INNER JOIN course
    ON course_cycle.course_id = course.course_id`
  const result = await pool.query(query)
  if (result.rowCount < 1) throw new NotFoundError('Классы не найдены')
  return res.status(StatusCodes.OK).json(result.rows)
}

export async function findOne(req: Request, res: Response) {
  const { id } = req.params
  const query = `
  SELECT course_cycle.id, course_cycle.description, course_cycle.start_date, course_cycle.end_date, course_cycle.open_for_enrollment, course_cycle.course_code, branch_office.name as branch_name, course.name as course_name
  FROM course_cycle
  INNER JOIN branch_office
  ON course_cycle.branch_id = branch_office.id
  INNER JOIN course
  ON course_cycle.course_id = course.course_id
  WHERE course_cycle.id = $1`
  const result = await pool.query(query, [id])
  if (result.rowCount < 1) throw new NotFoundError(`Класс с id ${id} не найден`)
  return res.status(StatusCodes.OK).json(result.rows[0])
}

export async function updateOne(req: Request, res: Response) {}

export async function createOne(req: Request, res: Response) {
  const clas = ClassReqBodySchema.parse({
    ...req.body,
    start_date: new Date(req.body.start_date),
    end_date: new Date(req.body.end_date),
  })
  const query = `
  INSERT INTO course_cycle (description, start_date, end_date, open_for_enrollment, course_code, branch_id, course_id) 
  VALUES($1, $2, $3, $4, $5, $6, $7)`
  const queryParams = [
    clas.description,
    clas.start_date,
    clas.end_date,
    clas.open_for_enrollment,
    clas.course_code,
    clas.branch_id,
    clas.course_id,
  ]
  const result = await pool.query(query, queryParams)
  if (result.rowCount < 1) throw new BadRequestError('Курс с таким же кодом уже существует')
  return res.status(StatusCodes.OK).json({ message: 'Создано успешно' })
}
