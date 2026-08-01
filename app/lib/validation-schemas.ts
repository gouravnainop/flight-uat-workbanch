'use client'
// ─────────────────────────────────────────────────────────────────────────────
// Validation Schemas — CLIENT-SIDE ONLY
// Yup schemas are class instances and cannot cross the server→client boundary.
// Add a schema here keyed by the endpoint id from api-catalog.ts.
// TryItTab imports this map directly (not via props).
// ─────────────────────────────────────────────────────────────────────────────

import type { ObjectSchema } from 'yup'
import * as yup from 'yup'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const schemas: Record<string, ObjectSchema<any>> = {
  'book-flight': yup.object({
    invId: yup.string().required('invId is required'),
    adult: yup
      .number()
      .typeError('adult must be a number')
      .min(1, 'At least 1 adult is required')
      .required('adult is required'),
    child: yup
      .number()
      .typeError('child must be a number')
      .min(0, 'child cannot be negative')
      .required('child is required'),
    infant: yup
      .number()
      .typeError('infant must be a number')
      .min(0, 'infant cannot be negative')
      .required('infant is required'),
    bookerEmail: yup
      .string()
      .email('bookerEmail must be a valid email')
      .required('bookerEmail is required'),
    bookerName: yup
      .string()
      .min(2, 'bookerName must be at least 2 characters')
      .required('bookerName is required'),
    bookerPhone: yup
      .string()
      .min(7, 'bookerPhone must be at least 7 digits')
      .required('bookerPhone is required'),
    passengers: yup
      .array()
      .of(
        yup.object({
          title: yup
            .string()
            .oneOf(
              ['Mr', 'Ms', 'Mrs', 'Master', 'Miss'],
              'title must be one of: Mr, Ms, Mrs, Master, Miss',
            )
            .required('passenger title is required'),
          firstName: yup.string().required('passenger firstName is required'),
          lastName: yup.string().required('passenger lastName is required'),
          travelerType: yup
            .string()
            .oneOf(
              ['Adult', 'Child', 'Infant'],
              'travelerType must be Adult, Child, or Infant',
            )
            .required('travelerType is required'),
          dob: yup
            .string()
            .matches(
              /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
              'DOB must be in DD/MM/YYYY format'
            ).test(
              'reuired-for-child-infant',
              'DOB is required for Child and Infant passengers',
              function (value) {
                const { travelerType } = this.parent
                if ((travelerType === 'Child' || travelerType === 'Infant') && !value) {
                  return this.createError({
                    message: 'DOB is required for Child and Infant passengers',
                  })
                }
                return true
              }
            )
            .optional(),
          passportNumber: yup.string().optional(),
          issueDate: yup.string().optional().matches(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Issue Date must be in DD/MM/YYYY format'
          ),
          expDate: yup.string().optional().matches(
            /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
            'Expiry Date must be in DD/MM/YYYY format'
          ),
          nationality: yup.string().optional(),
          passportIssuingCountry: yup.string().optional(),
          guardian: yup.string().test(
            'guardian-required-for-infant',
            'guardian is required for Infant passengers',
            function (value) {
              const { travelerType } = this.parent
              if (travelerType === 'Infant' && !value) {
                return this.createError({
                  message: 'guardian is required for Infant passengers',
                })
              }
              return true
            }
          ),
          wheelChair: yup.string().oneOf(
            ['Yes', 'No'],
            'wheelChair must be Yes or No',
          ),
        }),
      )
      .min(1, 'At least one passenger is required')
      .required('passengers is required'),
  }),
}

export default schemas
