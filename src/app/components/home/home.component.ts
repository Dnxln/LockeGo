import { Component, OnInit } from '@angular/core';
import { FormControl, Validators, FormGroup } from '@angular/forms';
import * as CryptoJS from 'crypto-js';
import seedrandom from 'seedrandom';

import { lowercaseValidator, noSpaceValidator } from './custom.validators';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  homeForm!: FormGroup;
  
  // form vars
  service: string = "";
  username: string = "";
  stolen_: number = 0;
  stolen: string = "";
  password: string = "";
  passwordLength: number = 32;
  selectedSpecialCharacters: string[] = [
    '_', '.', '-', '!', '?', '@', '*', '$', '%', '&', '#', '+', '=', '(', ')',
    '[', ']', '{', '}', '<', '>', ':', ';', ',', '`', "'", '"', '^', '/', '\\', '|', '~'
  ];
  finalPassword: string = "";

  // control vars
  hidePassword: boolean = true;
  hideFinalPassword: boolean = true;
  hideSettings: boolean = true;
  passwordInvalid: boolean = false;
  formInvalid: boolean = false;
  isPrimary: boolean = true;
  specialcharacters: string[] = [
    '_', '.', '-', '!', '?', '@', '*', '$', '%', '&', '#', '+', '=', '(', ')',
    '[', ']', '{', '}', '<', '>', ':', ';', ',', '`', "'", '"', '^', '/', '\\', '|', '~'
  ];
  //passwordLenghts: number[] = [16, 20, 32, 64, 128, 256, 512];

  constructor() {}

  ngOnInit() {
    this.homeForm = new FormGroup({
      service: new FormControl('', [Validators.required, Validators.maxLength(255), noSpaceValidator(), lowercaseValidator()]),
      username: new FormControl('', [Validators.required, Validators.maxLength(255), noSpaceValidator()]),
      stolen: new FormControl(0, [Validators.required, Validators.min(0), Validators.max(200)]),
      password: new FormControl('', [Validators.required, Validators.maxLength(255), noSpaceValidator()]),
      passwordLength: new FormControl(this.passwordLength, [Validators.required, Validators.min(1), Validators.max(512)]),
      selectedSpecialCharacters: new FormControl(this.selectedSpecialCharacters, [Validators.required])
    });

    this.homeForm.valueChanges.subscribe((formValue) => {
      if (formValue.service != '' && formValue.username != '' && formValue.stolen_ != '' && formValue.password != '') {
        this.formInvalid = false;
      }
    });
  }

  onSubmit() {
    this.finalPassword = "";
    this.hideSettings = true;
    this.hideFinalPassword = true;

    if (this.homeForm.invalid) {
      return;
    }
    
    this.service = this.homeForm.value.service;
    this.username = this.homeForm.value.username;
    this.stolen_ = this.homeForm.value.stolen;
    this.stolen = this.stolen_.toString();
    this.password = this.homeForm.value.password;
    this.passwordLength = this.homeForm.value.passwordLength;
    this.selectedSpecialCharacters = this.homeForm.value.selectedSpecialCharacters;

    if (!this.checkPassword(this.password)){
      this.passwordInvalid = true;
      this.resetPassword();
      return;
    } 
    else {
      this.passwordInvalid = false;
    }
    
    this.finalPassword = this.createPassword(this.service, this.username, this.stolen, this.password, this.passwordLength, this.selectedSpecialCharacters);    

    this.resetForm();
    this.formInvalid = true;
    this.isPrimary = true;
    this.hideFinalPassword = false;
  }

  clickEventPassword(event: MouseEvent) {
    this.hidePassword = !this.hidePassword;
    event.stopPropagation();
  }

  clickEventSettings(event: MouseEvent) {
    this.hideSettings = !this.hideSettings;
    event.stopPropagation();
  }

  clickEventCopy(event: MouseEvent) {
    navigator.clipboard.writeText(this.finalPassword);
    if (this.isPrimary) {
      this.isPrimary = false;
    }
    event.stopPropagation();
  }

  private checkPassword(str: string): boolean {
    const allowedChars = /^[a-zA-Z0-9_.\-!?@*$%&#+=()\[\]{}<>,`'"^\/\\|~]+$/;

    if (str.length >= 8 && str.length <= 255 && allowedChars.test(str)) {
        const hasLowercase = /[a-z]/.test(str);
        const hasUppercase = /[A-Z]/.test(str);
        const hasDigit = /[0-9]/.test(str);
        const hasSpecialChar = /[_.\-!?@*$%&#+=()\[\]{}<>:;,`'"^\/\\|~]/.test(str);

        return hasLowercase && hasUppercase && hasDigit && hasSpecialChar;
    }
    return false;
  } 

  private resetPassword() {
    this.homeForm.setValue({
      service: this.service,
      username: this.username,
      stolen: this.stolen_,
      password: '',
      passwordLength: this.passwordLength,
      selectedSpecialCharacters: this.selectedSpecialCharacters
    });
  }

  private resetForm() {
    this.homeForm.setValue({
      service: '',
      username: '',
      stolen: 0,
      password: '',
      passwordLength: this.passwordLength,
      selectedSpecialCharacters: ['_', '.', '-', '!', '?', '@', '*', '$', '%', '&', '#', '+', '=']
    });

    Object.keys(this.homeForm.controls).forEach(key => {
      this.homeForm.get(key)?.setErrors(null);
    });
    
    this.homeForm.markAsUntouched();
    this.homeForm.markAsPristine();
  }

  private createPassword(service: string, username: string, stolen: string, password: string, passwordLength: number, selectedSpecialCharacters: string[]): string {
    const hashedService = this.sha256(service);
    const hashedUsername = this.sha256(username);
    const hashedStolen = this.sha256(stolen);
    const hashedPassword = this.sha256(password);

    const listUc: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const listLc: string = "abcdefghijklmnopqrstuvwxyz";
    const listNb: string = "0123456789";
    const listSc: string = selectedSpecialCharacters.join('');

    const seed = this.xor(
        hashedUsername.slice(0, 32),
        hashedService.slice(-32),
        hashedStolen.slice(-32),
        hashedPassword.slice(-32)
    );

    const s1 = this.sha256(hashedUsername + hashedService + hashedStolen + hashedPassword);
    const hashedSeed = this.sha256(seed);
    const s2 = this.xor(hashedSeed, s1);
    const hashedS2 = this.sha256(s2);

    let s2SelectedLetters = '';
    let s2SelectedLettersArr = new Array(hashedS2.length).fill('');
    for (let i = 0; i < hashedS2.length; i += 2) {
        s2SelectedLettersArr[i + 1] = hashedS2.charAt(i);
    }
    for (let i = 1; i < hashedS2.length; i += 2) {
        s2SelectedLettersArr[i - 1] = hashedS2.charAt(i);
    }
    s2SelectedLetters = s2SelectedLettersArr.join('');
    const hashedS2SelectedLetters = this.sha256(s2SelectedLetters);

    const s3 = this.xor(hashedS2SelectedLetters, hashedSeed);
    const hashedS3 = this.sha256(s3);
    const s4 = this.xor(hashedS3, hashedSeed);
    const hashedS4 = this.sha256(s4);
    const s5 = this.xor(hashedS4, hashedSeed);
    const hashedS5 = this.sha256(s5);
    const s6 = this.xor(hashedS5, hashedSeed);
    const hashedS6 = this.sha256(s6);
    let sf = hashedS3 + hashedS4 + hashedS5 + hashedS6;

    sf = this.resizePassword(sf, hashedPassword, passwordLength);

    let percUc: number  = this.pseudoRandomPerc(23, 31, hashedS3);
    let percSc: number  = this.pseudoRandomPerc(29, 36, hashedS4);
    let percNb: number  = this.pseudoRandomPerc(19, 24, hashedS5);
    let percLc: number  = ((100 - percUc) - percSc) - percNb;
    
    percUc = (passwordLength*percUc) / 100;
    percSc = (passwordLength*percSc) / 100;
    percNb = (passwordLength*percNb) / 100;
    percLc = (passwordLength*percLc) / 100;

    let check = 0;
    let variationCounter: number = 0;
    const tolerance = (3 / 100) * passwordLength;
    let tup: [string, number, number, number, number, number] = [
      sf, 
      this.charCounter(sf, listUc, this.passwordLength), // 1 = totUc
      this.charCounter(sf, listSc, this.passwordLength), // 2 = totSc
      this.charCounter(sf, listNb, this.passwordLength), // 3 = totNb
      this.charCounter(sf, listLc, this.passwordLength), // 4 = totLc
      variationCounter // 5 = variationCounter
    ];
      
    while (check === 0) {
      if (tup[1] < percUc - tolerance || tup[1] > percUc + tolerance) {
        tup = this.changeChar(percUc, listUc, listUc, listSc, listNb, listLc, passwordLength, tup[1], tup, hashedSeed, tolerance);
      } else if (tup[2] < percSc - tolerance || tup[2] > percSc + tolerance) {
        tup = this.changeChar(percSc, listSc, listUc, listSc, listNb, listLc, passwordLength, tup[2], tup, hashedSeed, tolerance);
      } else if (tup[3] < percNb - tolerance || tup[3] > percNb + tolerance) {
        tup = this.changeChar(percNb, listNb, listUc, listSc, listNb, listLc, passwordLength, tup[3], tup, hashedSeed, tolerance);
      } else if (tup[4] < percLc - tolerance || tup[4] > percLc + tolerance) {
        tup = this.changeChar(percLc, listLc, listUc, listSc, listNb, listLc, passwordLength, tup[4], tup, hashedSeed, tolerance);
      } else {
        check = 1;
      }
    }
    
    return tup[0];
  }

  private sha256(str: string): string {
    const hash = CryptoJS.SHA256(str);
    return hash.toString(CryptoJS.enc.Hex);
  }

  private xor(str1: string, str2: string, str3?: string, str4?: string): string {
    let result = '';
    for (let i = 0; i < str1.length; i++) {
        let xorValue = parseInt(str1.charAt(i), 16);
        xorValue ^= parseInt(str2.charAt(i), 16);
        if (str3) {
            xorValue ^= parseInt(str3.charAt(i), 16);
        }
        if (str4) {
            xorValue ^= parseInt(str4.charAt(i), 16);
        }
        result += xorValue.toString(16);
    }
    return result;
  }

  private pseudoRandomPerc(minPerc: number, maxPerc: number, seed: string): number {
    const rng = seedrandom(seed);
    const randomValue = rng();
    const number = minPerc + randomValue * (maxPerc - minPerc);
    console.log(number);
    return number;
  }

  private charCounter(password: string, charString: string, passwordLength: number): number {
    let total: number = 0;

    for (let i = 0; i < passwordLength; i++) {
        if (charString.includes(password.charAt(i))) {
            total += 1;
        }
    }

    return total;
  }

  private resizePassword(inputString: string, seed: string, passwordLength: number): string {
    const rng = seedrandom(seed);
    let generatedPassword = '';

    while (generatedPassword.length < passwordLength) {
        const randomIndex = Math.floor(rng() * inputString.length);
        generatedPassword += inputString.charAt(randomIndex);
    }

    return generatedPassword;
  }

  private changeChar(perc: number, listM: string, listUc: string, listSc: string, listNb: string, listLc: string, passwordLength: number, totM: number, tup: [string, number, number, number, number, number], seed: string, tolerance: number): [string, number, number, number, number, number] {
    let [password, totUc, totSc, totNb, totLc, variationCounter] = tup;

    while (totM < perc - tolerance || totM > perc + tolerance){
      let variationSeed = seed + variationCounter;
      variationCounter++;
      let rng = seedrandom(variationSeed);
      let position = Math.floor(rng() * passwordLength);
      
      if (totM < perc - tolerance) {
        if (!listM.includes(password[position])) {
            if (listUc.includes(password[position])) {
                totUc--;
            } else if (listSc.includes(password[position])) {
                totSc--;
            } else if (listNb.includes(password[position])) {
                totNb--;
            } else {
                totLc--;
            }
            let password_: string[] = password.split('');
            password_[position] = listM[Math.floor(rng() * listM.length)];
            password = password_.join('');
            totM++;
        }
      }
      if (totM > perc + tolerance) {
        if (listM.includes(password[position])) {
          let password_: string[] = password.split('');
          password_[position] = listLc[Math.floor(rng() * listLc.length)];
          password = password_.join('');
          totM--;
          totLc++;
        }
      }
    }
    if (listM === listUc) {
      totUc = totM;
    } else if (listM === listSc) {
        totSc = totM;
    } else if (listM === listNb) {
        totNb = totM;
    } else {
        totLc = totM;
    }
    

    tup = [password, totUc, totSc, totNb, totLc, variationCounter];
    return tup;
  }
}