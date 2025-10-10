import { z } from "zod"

export const doctorFormSchema = z.object({
  patientName: z.string().min(2, {
    message: "Patient name must be at least 2 characters.",
  }),
  age: z.string().min(1, {
    message: "Age is required.",
  }),
  gender: z.string().optional(),
  chiefComplaint: z.string().min(3, {
    message: "Chief complaint must be at least 3 characters.",
  }),
  symptoms: z.string().optional(),
  medicalHistory: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
})

export type DoctorFormValues = z.infer<typeof doctorFormSchema>
