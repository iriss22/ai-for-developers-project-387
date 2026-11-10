package io.hexlet.calendar;

import com.fasterxml.jackson.annotation.JsonSetter;
import com.fasterxml.jackson.annotation.Nulls;
import org.springframework.boot.jackson.autoconfigure.JsonMapperBuilderCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import tools.jackson.databind.MapperFeature;
import tools.jackson.databind.cfg.CoercionAction;
import tools.jackson.databind.cfg.CoercionInputShape;
import tools.jackson.databind.type.LogicalType;

/**
 * Типы полей JSON строгие, как в контракте (contract/main.tsp): Jackson не приводит число к строке
 * и строку к числу, а null в строковом поле не принимает (необязательные поля в контракте либо
 * строка, либо отсутствуют). Такой запрос получает 400 (ApiExceptionHandler). Нашёл Schemathesis,
 * см. ApiErrorContractTest.
 */
@Configuration
class JacksonConfig {

  @Bean
  JsonMapperBuilderCustomizer strictScalarTypes() {
    return builder ->
        builder
            // строка в числовом или логическом поле ("30" вместо 30)
            .disable(MapperFeature.ALLOW_COERCION_OF_SCALARS)
            // число или логическое значение в строковом поле (4194304 вместо "…")
            .withCoercionConfig(
                LogicalType.Textual,
                config ->
                    config
                        .setCoercion(CoercionInputShape.Integer, CoercionAction.Fail)
                        .setCoercion(CoercionInputShape.Float, CoercionAction.Fail)
                        .setCoercion(CoercionInputShape.Boolean, CoercionAction.Fail))
            // null в строковом поле ("description": null): в контракте его нет ни в одном запросе
            .withConfigOverride(
                String.class,
                override -> override.setNullHandling(JsonSetter.Value.forValueNulls(Nulls.FAIL)));
  }
}
