package io.hexlet.calendar;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Отдаёт index.html фронтенда на маршруты React Router, чтобы прямой заход и обновление страницы
 * (например, /admin) не давали 404.
 *
 * <p>Ловит только односегментные пути без точки: файлы вроде /favicon.svg и /assets/*.js остаются
 * статике, а /api и /actuator — своим обработчикам.
 */
@Controller
class SpaForwardController {

  @GetMapping({"/", "/{path:(?!api$|actuator$)[^.]+}"})
  String index() {
    return "forward:/index.html";
  }
}
