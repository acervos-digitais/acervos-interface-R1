import { Sorter } from "./Sorter.js";
import { ColorSorter } from "./ColorSorter.js";
import { DateSorter } from "./DateSorter.js";

class DateColorSorter extends Sorter {
  constructor(data) {
    super(data, "dateXcolor");

    this.picker = document.getElementById("dateXcolor--sorter--color-picker");

    this.dispatchTimeout = null;
    const dispatchColor = () => {
      this.color = ColorSorter.hexToRgb(this.picker.value);
      document.dispatchEvent(this.sortDataEvent);
    };

    this.picker.addEventListener("input", () => {
      if (this.dispatchTimeout !== null) {
        clearTimeout(this.dispatchTimeout);
      }
      this.dispatchTimeout = setTimeout(dispatchColor, 100);
    });

    this.color = ColorSorter.hexToRgb(this.picker.value);
  }

  sort(validIdsSet) {
    if (!this.enableEl.checked) return;

    const byYear = DateSorter.sortByYear(validIdsSet, this.data);

    return byYear.map(({ year, ids }) => ({
      year,
      ids: ColorSorter.sortIdColors(ids, this.data, this.color).map(x => x.id)
    }));
  }
}

export { DateColorSorter };
