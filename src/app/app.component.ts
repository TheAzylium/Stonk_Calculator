import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CONSTANTS } from './constants';
import { NumberFormatPipe } from "./shared/number-format.pipe";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    imports: [CommonModule, ReactiveFormsModule, NumberFormatPipe]
})
export class AppComponent implements OnInit {
  form: FormGroup = this._fb.group({
    bank: ['ATM'],
    amount: [null, [this.maxValidator.bind(this), Validators.required]],
    smallBags: [true],
    mediumBags: [true],
    isPsycho: [false],
    psychoValue: [{ value: null, disabled: true }, [Validators.max(3000)]],
  }, { validators: this.bagsValidator });

  result: any;
  constructor(private _fb: FormBuilder) {}

  ngOnInit() {
    this.form.get('bank')?.valueChanges.subscribe(() => {
      const amountControl = this.form.get('amount');
      amountControl?.updateValueAndValidity();
    });
    this.form.get('isPsycho')?.valueChanges.subscribe((value) => {
      if (value) {
        this.form.get('psychoValue')?.enable();
      } else {
        this.form.get('psychoValue')?.disable();
      }
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.calculateAndDisplay();
      }
    });
  }

  maxValidator(control: any) {
    let max = 0;

    switch (this.form?.get('bank')?.value) {
      case 'ATM':
        max = CONSTANTS.ATM;
        break;
      case 'Fleeca':
        max = CONSTANTS.FLEECA;
        break;
      case 'Pacific':
        max = CONSTANTS.PACIFIC;
        break;
    }

    return control.value > max ? { maxError: true } : null;
  }

  get amountError(): string {
    const errors = this.form.get('amount')?.errors;
    if (errors) {
      if (errors['maxError']) {
        return `Le montant maximum pour ${
          this.form.get('bank')?.value
        } est dépassé.`;
      }
    }
    return '';
  }

  get psychoValueError(): string {
    const errors = this.form.get('psychoValue')?.errors;
    if (errors) {
      if (errors['max']) {
        return 'Le montant maximum est de $3 000.';
      }
    }
    return '';
  }

  calculateBagsAndTotal(
    machineType: 'ATM' | 'FLEECA' | 'PACIFIC',
    inputAmount: number,
    isPsycho: boolean,
    maxRemoval = 0,
    smallBags = true,
    mediumBags = true
  ) {
    const MAX_MONEY = CONSTANTS[machineType];
    const { MAX_STACK_BAG_MEDIUM, MAX_STACK_BAG_SMALL, MEDIUM_BAG, SMALL_BAG } =
      CONSTANTS;

    let combinations = [];

    const mediumLimit = mediumBags ? MAX_STACK_BAG_MEDIUM : 0;
    const smallLimit = smallBags ? MAX_STACK_BAG_SMALL : 0;

    for (let medium = 0; medium <= mediumLimit; medium++) {
      for (let small = 0; small <= smallLimit; small++) {
        const totalAdded = medium * MEDIUM_BAG + small * SMALL_BAG;
        let removalAmount = 0;

        if (isPsycho) {
          removalAmount = inputAmount + totalAdded - MAX_MONEY;
          if (removalAmount <= maxRemoval && removalAmount >= 0) {
            combinations.push({
              medium,
              small,
              totalAdded,
              removalAmount,
              finalAmount: MAX_MONEY,
            });
          }
        } else if (inputAmount + totalAdded <= MAX_MONEY) {
          combinations.push({
            medium,
            small,
            totalAdded,
            removalAmount,
            finalAmount: inputAmount + totalAdded,
          });
        }
      }
    }

    combinations.sort(
      (a, b) =>
        b.finalAmount - a.finalAmount ||
        a.removalAmount - b.removalAmount ||
        a.medium + a.small - (b.medium + b.small)
    );
    return combinations[0];
  }

  calculateAndDisplay() {
    const bankType = this.form.get('bank')?.value.toUpperCase();
    const inputAmount = this.form.get('amount')?.value;
    const isPsycho = this.form.get('isPsycho')?.value;
    const maxRemoval = this.form.get('psychoValue')?.value || 0;
    const smallBags = this.form.get('smallBags')?.value;
    const mediumBags = this.form.get('mediumBags')?.value;
    const result = this.calculateBagsAndTotal(
      bankType,
      inputAmount,
      isPsycho,
      maxRemoval,
      smallBags,
      mediumBags
    );
    this.displayResult(result);
  }

  displayResult(result: any) {
    this.result = result;
  }

  bagsValidator(g: FormGroup): { [key: string]: any } | null {
    const smallBags = g.get('smallBags')?.value;
    const mediumBags = g.get('mediumBags')?.value;

    // Vérifiez si les deux sont false
    if (!smallBags && !mediumBags) {
      return { noBagsSelected: true };
    }
    return null;
  }
}
