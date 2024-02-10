let tg = window.Telegram.WebApp;
tg.expand();

let idUser = tg.initDataUnsafe.user.id;

getRequest();

/**
 * Setup
 */
const debugEl = document.getElementById('debug'),
  // Mapping of indexes to icons: start from banana in middle of initial position and then upwards
  iconMap = ["chupakru", "chupachups", "cherry", "plum", "orange", "bell", "bar", "candyto", "candy"],
  // Width of the icons
  icon_width = 79,
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
const roll = (reel, offset = 0) => {
	// Minimum of 2 + the reel offset rounds
	const delta = (offset + 2) * num_icons + Math.round(Math.random() * num_icons); 
	
	// Return promise so we can wait for all reels to finish
	return new Promise((resolve, reject) => {
		
		const style = getComputedStyle(reel),
					// Current background position
					backgroundPositionY = parseFloat(style["background-position-y"]),
					// Target background position
					targetBackgroundPositionY = backgroundPositionY + delta * icon_height,
					// Normalized background position, for reset
					normTargetBackgroundPositionY = targetBackgroundPositionY%(num_icons * icon_height);
		
		// Delay animation with timeout, for some reason a delay in the animation property causes stutter
		setTimeout(() => { 
			// Set transition properties ==> https://cubic-bezier.com/#.41,-0.01,.63,1.09
			reel.style.transition = `background-position-y ${(8 + 1 * delta) * time_per_icon}ms cubic-bezier(.41,-0.01,.63,1.09)`;
			// Set background position
			reel.style.backgroundPositionY = `${backgroundPositionY + delta * icon_height}px`;
		}, offset * 150);
			
		// After animation
		setTimeout(() => {
			// Reset position, so that it doesn't get higher without limit
			reel.style.transition = `none`;
			reel.style.backgroundPositionY = `${normTargetBackgroundPositionY}px`;
			// Resolve this promise
			resolve(delta%num_icons);
		}, (8 + 1 * delta) * time_per_icon + offset * 150);
		
	});
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
  debugEl.textContent = 'rolling...';
  const reelsList = document.querySelectorAll('.slots > .reel');

  Promise.all([...reelsList].map((reel, i) => roll(reel, i)))
    .then(deltas => {
      // add up indexes
      deltas.forEach((delta, i) => indexes[i] = (indexes[i] + delta) % num_icons);
      debugEl.textContent = indexes.map(i => iconMap[i]).join(' - ');

      // Win conditions
      if (indexes[0] == indexes[1] && indexes[1] == indexes[2]) {
        const winCls = "win2";
        document.querySelector(".slots").classList.add(winCls);

        // Добавить обработчик события transitionend
        document.querySelector(".slots").addEventListener('transitionend', handleAnimationEnd);

        setTimeout(() => document.querySelector(".slots").classList.remove(winCls), 2500);
      } else if (indexes[0] == indexes[1] || indexes[1] == indexes[2]) {
        const winCls = "win1";
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
  let request = new XMLHttpRequest();

  request.onload = () => {
    if (request.status === 200) {
      const json = request.response;
      document.getElementById("balance").innerHTML = json["balance"];
    }
  };

  request.responseType = "json";
  request.open("GET", "https://chupa-pupa-29ab2bbfb5f8.herokuapp.com/balanceValue/" + String(idUser));
  request.setRequestHeader("Accept", "application/json");
  request.send();
  }
  // А это некий предзапрос, он принимает value(сумму выигрыша, проигрыша), а также
  // от себя добавляет id пользователя телеграмма, на данный момент он отправляет
  // только мой id для теста смотри html, button test
  function inPost(value) {
    postReq(String(idUser), Number(value));
}

//А это запрос на изменение
function postReq(userId, value) {
  let body = String(userId) + Number(value);
  let secondRequest = new XMLHttpRequest();
  secondRequest.open("POST", "https://chupa-pupa-29ab2bbfb5f8.herokuapp.com/editValue", true);
  secondRequest.setRequestHeader("Accept", "application/json");
  secondRequest.send(body);
}
