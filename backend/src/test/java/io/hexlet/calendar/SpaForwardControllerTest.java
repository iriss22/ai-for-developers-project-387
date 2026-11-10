package io.hexlet.calendar;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(SpaForwardController.class)
class SpaForwardControllerTest {

  @Autowired private MockMvc mvc;

  @ParameterizedTest
  @ValueSource(strings = {"/", "/book", "/admin"})
  void forwardsFrontendRoutesToIndex(String path) throws Exception {
    mvc.perform(get(path)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
  }

  @ParameterizedTest
  @ValueSource(strings = {"/api", "/actuator", "/favicon.svg", "/assets/index.js"})
  void leavesApiAndFilesAlone(String path) throws Exception {
    mvc.perform(get(path)).andExpect(forwardedUrl(null));
  }
}
