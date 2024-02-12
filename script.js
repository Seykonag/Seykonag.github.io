let tg = window.Telegram.WebApp;
tg.expand();

let idUser = tg.initDataUnsafe.user.id;

var balance = 0;

getRequest();

const debugEl = document.getElementById('debug'),
  // Mapping of indexes to icons: start from banana in middle of initial position and then upwards
  iconMap = ["chupakru", "chupachups", "cherry", "plum", "orange", "bell", "bar", "candyto", "candy"],
  // Height of one icon in the strip
  icon_height = 79,
  // Number of icons in the strip
  num_icons = 9,
  // Max-speed in ms for animating one icon down
  time_per_icon = 100,
  // Holds icon indexes
  indexes = [0, 0, 0];

var leverBall = document.querySelector('#lever-ball');
var leverBar = document.querySelector('#lever-bar');

var root = document.querySelector(':root');

/** 
 * Roll one reel
 */
const roll = async (reel, offset = 0) => {
  const delta = (offset + 2) * num_icons + Math.round(Math.random() * num_icons);
  
  const style = getComputedStyle(reel);
  const backgroundPositionY = parseFloat(style.backgroundPositionY);
  const targetBackgroundPositionY = backgroundPositionY + delta * icon_height;
  const normTargetBackgroundPositionY = targetBackgroundPositionY % (num_icons * icon_height);

  reel.style.transition = `background-position-y ${(8 + 1 * delta) * time_per_icon}ms cubic-bezier(.41,-0.01,.63,1.09)`;
  reel.style.backgroundPositionY = `${backgroundPositionY + delta * icon_height}px`;

  await new Promise((resolve) => setTimeout(resolve, (8 + 1 * delta) * time_per_icon + offset * 150));

  reel.style.transition = 'none';
  reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;

  return delta % num_icons;
};

/**
 * Roll all reels, when promise resolves roll again
 */
var isAnimationInProgress = false;

function handleAnimationEnd() {
  // Разблокировать анимацию слотов
  isAnimationInProgress = false;

  // Убрать классы анимации рычага
  leverBall.classList.remove('downBall');
  leverBar.classList.remove('downBar');

  // Удалить обработчик события, чтобы избежать многократного выполнения
  document.querySelector(".slots").removeEventListener('transitionend', handleAnimationEnd);
}

function rollAll() {
  const reelsList = document.querySelectorAll('.slots > .reel');

  Promise.all([...reelsList].map((reel, i) => roll(reel, i)))
    .then(deltas => {
      // add up indexes
      deltas.forEach((delta, i) => indexes[i] = (indexes[i] + delta) % num_icons);

      // Win conditions
      if (indexes[0] == indexes[1] || indexes[1] == indexes[2]) {
        const winCls = indexes[0] == indexes[2] ? "win2" : "win1";
        document.querySelector(".slots").classList.add(winCls);

        // Добавить обработчик события transitionend
        document.querySelector(".slots").addEventListener('transitionend', handleAnimationEnd);

        setTimeout(() => document.querySelector(".slots").classList.remove(winCls), 2500);
      }
      // Again!
      handleAnimationEnd();
    });
}

leverBall.addEventListener('click', function () {
  // Если анимация уже выполняется, не обрабатывать клик
  if (isAnimationInProgress) {
    return;
  }
	
  balance += 10;
  document.getElementById("balance").innerHTML = balance;
  postReq(10);

  // Блокировать анимацию слотов
  isAnimationInProgress = true;

  // Запустить анимацию рычага
  leverBall.classList.add('downBall');
  leverBar.classList.add('downBar');

  // Запустить анимацию слотов и после ее завершения разблокировать
  rollAll();
});

function getRequest() {
  // Это все запрос на баланс
const request = new XMLHttpRequest();
	
  request.onload = () => {
    if (request.status === 200) {
      const json = request.response;
      balance = json["balance"];
      document.getElementById("balance").innerHTML = json["balance"];
    }
  };

  request.responseType = "json";
  request.open("GET", "https://chupa-pupa-29ab2bbfb5f8.herokuapp.com/balanceValue/" + String(idUser), true);
  request.setRequestHeader("Accept", "application/json");
  request.send();
  }
  // А это некий предзапрос, он принимает value(сумму выигрыша, проигрыша), а также
  // от себя добавляет id пользователя телеграмма, на данный момент он отправляет
  // только мой id для теста смотри html, button test

//А это запрос на изменение
function postReq(value) {
  const secondRequest = new XMLHttpRequest();
  let body = [idUser, value];
  secondRequest.open("POST", "https://chupa-pupa-29ab2bbfb5f8.herokuapp.com/editValue", true);
  secondRequest.setRequestHeader("Accept", "application/json");
  secondRequest.send(body);
}

$(document).ready(function() {
    // Прибавляем кол-во по клику
    $('.quantity_inner .bt_plus').click(function() {
        let $input = $(this).parent().find('.quantity');
        let count = parseInt($input.val()) + 5;
        $input.val(parseInt(count));
    });
    
    // Убавляем кол-во по клику
    $('.quantity_inner .bt_minus').click(function() {
        let $input = $(this).parent().find('.quantity');
        let count = parseInt($input.val()) - 5;
        if (count < 5) {
            count = 5;
        }
        $input.val(parseInt(count));
    });
    
    // Убираем все лишнее и невозможное при изменении поля
    $('.quantity_inner .quantity').bind("change keyup input click", function() {
        if (this.value.match(/[^0-9]/g)) {
            this.value = this.value.replace(/[^0-9]/g, '');
        }
        if (this.value < 5) {
            this.value = 5;
        }
    });
});
