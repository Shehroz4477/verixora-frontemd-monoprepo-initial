import { Component, EventEmitter, Input, Output, ViewChildren, ElementRef, QueryList, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
    selector: 'app-otp',
    templateUrl: './otp.component.html',
    styleUrls: ['./otp.component.scss'],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => OtpComponent),
            multi: true
        }
    ],
    standalone: false
})
export class OtpComponent implements ControlValueAccessor {
  @Input() timer: number = 0;
  @Input() isVisible: boolean = false;

  @Output() otpComplete = new EventEmitter<string>();

  digits: string[] = ['', '', '', '', '', ''];
  private onChange: any = () => {};
  private onTouched: any = () => {};

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  get value(): string {
    return this.digits.join('');
  }

  writeValue(value: string): void {
    if (value) {
      const arr = value.split('');
      for (let i = 0; i < 6 && i < arr.length; i++) {
        this.digits[i] = arr[i];
      }
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }

  onInput(event: any, index: number) {
    const value = event.target.value;
    if (value && value.length > 1) {
      this.digits[index] = value.slice(0, 1);
    }
    if (value && index < 5) {
      setTimeout(() => {
        const next = this.otpInputs.toArray()[index + 1];
        if (next) next.nativeElement.focus();
      }, 50);
    }
    this.emitValue();
  }

  onKeydown(event: any, index: number) {
    if (event.key === 'Backspace' && !event.target.value && index > 0) {
      setTimeout(() => {
        const prev = this.otpInputs.toArray()[index - 1];
        if (prev) prev.nativeElement.focus();
      }, 50);
    }
  }

  private emitValue() {
    const val = this.value;
    this.onChange(val);
    this.onTouched();
    if (val.length === 6) {
      this.otpComplete.emit(val);
    }
  }

  reset() {
    this.digits = ['', '', '', '', '', ''];
    this.onChange('');
    setTimeout(() => {
      const first = this.otpInputs?.first;
      if (first) first.nativeElement.focus();
    }, 100);
  }
}