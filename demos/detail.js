'use strict';

const estimate = document.getElementById('estimate');
const service = document.getElementById('package');
const carClass = document.getElementById('car-class');
const result = document.getElementById('estimate-result');
const request = document.getElementById('detail-request');
const summary = document.getElementById('request-summary');
const currency = new Intl.NumberFormat('ru-RU', {
  style: 'currency',
  currency: 'RUB',
  maximumFractionDigits: 0,
});

function updateEstimate() {
  const basePrice = Number(service.selectedOptions[0].dataset.price);
  result.value = currency.format(basePrice + Number(carClass.value));
}

estimate.addEventListener('change', updateEstimate);
document.querySelectorAll('[data-package]').forEach(link => {
  link.addEventListener('click', () => {
    service.value = link.dataset.package;
    updateEstimate();
  });
});

estimate.addEventListener('submit', event => {
  event.preventDefault();
  summary.textContent = [
    service.selectedOptions[0].textContent,
    carClass.selectedOptions[0].textContent,
    result.value,
  ].join(' · ');
  request.showModal();
});

updateEstimate();


const guideForm = document.getElementById('guide-form');
const questionField = document.getElementById('guide-question');
const answer = document.getElementById('detail-answer');

guideForm.addEventListener('submit', event => {
  event.preventDefault();
  const question = questionField.value.trim().toLowerCase();
  if (/адрес|где|доехать|маршрут/.test(question)) {
    answer.textContent = 'Адрес ориентира и ссылка на карту находятся в разделе «Как добраться».';
    return;
  }
  const topics = [
    [/комплекс|вместе|полный/, 'full'],
    [/салон|химчист|сиден/, 'interior'],
    [/кузов|мойк|уход/, 'body'],
  ];
  const match = topics.find(([pattern]) => pattern.test(question));
  if (!match) {
    answer.textContent = 'Спросите об уходе за кузовом, химчистке салона или комплексном пакете.';
    return;
  }
  service.value = match[1];
  updateEstimate();
  answer.textContent = service.selectedOptions[0].textContent + '. Для выбранного класса автомобиля ориентир ' + result.value + '. Пакет выбран в калькуляторе.';
});
