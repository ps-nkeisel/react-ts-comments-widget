import { action, computed, decorate, observable } from 'mobx';

export interface IAlertValue {
  type: 'error' | 'warning' | 'success';
  message: string;
  timeout?: number;
}

export interface IAlert {
  value: IAlertValue | null;
  close(): void;
}

/** This class is responsible for showing/hiding/removing alerts for other components */
class Alert implements IAlert {
  @observable
  private alertValue: IAlertValue | null = null;
  private alertTimeout: any; // Timeout saved in this variable for further canceling

  @computed
  get value(): IAlertValue | null {
    return this.alertValue;
  }

  set value(alertObj: IAlertValue | null) {
    clearTimeout(this.alertTimeout);
    this.alertValue = alertObj;
    if (alertObj) {
      this.alertTimeout = setTimeout(this.close, alertObj.timeout || 7000);
    }
  }

  /** Just a simple helper to easily pass close function as a callback */
  public close = () => (this.value = null);
}

decorate(Alert, {
  close: action,
});

export default Alert;
