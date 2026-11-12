'use strict';

const booking = document.getElementById('booking');
const choice = document.getElementById('choice');
const specialist = document.getElementById('specialist');
const date = document.getElementById('date');
const time = document.getElementById('time');
const feedback = document.getElementById('feedback');
const today = new Date();
date.min = [today.getFullYear(), today.getMonth() + 1, today.getDate()]
  .map(value => String(value).padStart(2, '0')).join('-');

let opener;
document.querySelectorAll('[data-book]').forEach(button => {
  button.addEventListener('click', () => {
    opener = button;
    if (button.dataset.book !== '') choice.selectedIndex = Number(button.dataset.book);
    if (specialist) specialist.value = button.dataset.specialist || '';
    feedback.textContent = 'Данные остаются в браузере. Реальный визит не создаётся.';
    booking.showModal();
  });
});
booking.querySelector('.close').addEventListener('click', () => booking.close());
booking.addEventListener('close', () => opener?.focus());
document.getElementById('booking-form').addEventListener('submit', event => {
  event.preventDefault();
  const [year, month, day] = date.value.split('-').map(Number);
  const formatted = new Intl.DateTimeFormat('ru-RU', { dateStyle: 'long' })
    .format(new Date(year, month - 1, day));
  const selection = [choice.value, specialist?.value, formatted, time.value].filter(Boolean).join(', ');
  feedback.textContent = `Демо пройдено: ${selection}. Визит не создан.`;
});

const questions = document.querySelectorAll('[data-answer]');
const guide = JSON.parse(document.getElementById('guide-data').textContent);
const guideBook = document.getElementById('guide-book');
const answer = document.getElementById('answer');

function showRecommendation(index) {
  const recommendation = guide[index];
  answer.textContent = recommendation.text;
  guideBook.dataset.book = recommendation.choice;
  guideBook.hidden = false;
}

questions.forEach(button => {
  button.setAttribute('aria-pressed', 'false');
  button.addEventListener('click', () => {
    questions.forEach(question => question.setAttribute('aria-pressed', String(question === button)));
    showRecommendation(Number(button.dataset.answer));
  });
});

const guideForm = document.getElementById('guide-form');
const topics = JSON.parse(guideForm.dataset.topics).map(pattern => new RegExp(pattern, 'i'));
guideForm.addEventListener('submit', event => {
  event.preventDefault();
  const question = document.getElementById('guide-question').value.trim();
  const index = topics.findIndex(topic => topic.test(question));
  questions.forEach(button => button.setAttribute('aria-pressed', 'false'));
  if (index >= 0) {
    showRecommendation(index);
    return;
  }
  guideBook.hidden = true;
  answer.textContent = /адрес|где|доехать|маршрут/i.test(question)
    ? 'Адрес ориентира и ссылка на карту находятся в разделе «Как добраться».'
    : 'Выберите подсказку выше или напишите, какая услуга либо какой повод вас интересует.';
});

const filters = document.querySelectorAll('[data-filter]');
const offers = document.querySelectorAll('.offer');
filters.forEach((button, index) => {
  button.addEventListener('click', () => {
    filters.forEach(filter => filter.setAttribute('aria-pressed', String(filter === button)));
    offers.forEach(offer => { offer.hidden = index !== 0 && offer.dataset.category !== button.dataset.filter; });
  });
});

const heroPhoto = document.querySelector('.hero-art img');
const showPhoto = () => heroPhoto.classList.toggle('loaded', heroPhoto.naturalWidth > 0);
heroPhoto.addEventListener('load', showPhoto);
if (heroPhoto.complete) showPhoto();
