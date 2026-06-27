import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Country, CountryService } from '../core/services/country.service';

@Component({
  selector: 'app-country-selector-modal',
  templateUrl: './country-selector-modal.component.html',
  styleUrls: ['./country-selector-modal.component.scss']
})
export class CountrySelectorModalComponent implements OnInit {
  countries: Country[] = [];
  filteredCountries: Country[] = [];
  searchTerm: string = '';

  constructor(
    private modalController: ModalController,
    private countryService: CountryService
  ) {}

  ngOnInit() {
    this.countries = this.countryService.countries;
    this.filteredCountries = this.countries;
  }

  filterCountries() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredCountries = this.countries;
      return;
    }
    this.filteredCountries = this.countries.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.code.toLowerCase().includes(term) ||
      c.dial.includes(term)
    );
  }

  selectCountry(country: Country) {
    this.modalController.dismiss(country);
  }

  close() {
    this.modalController.dismiss();
  }
}