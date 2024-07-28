import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function lowercaseValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && value !== value.toLowerCase()) {
      return { lowercase: true };
    }
    return null;
  };
}

export function noSpaceValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    if (value && /\s/.test(value)) {
      return { noSpace: true };
    }
    return null;
  };
}
