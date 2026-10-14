package com.metaarch.alerts.config;

import java.util.HashMap;
import java.util.Map;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.support.serializer.ErrorHandlingDeserializer;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

import com.metaarch.alerts.event.BookingAlertEvent;
import com.metaarch.alerts.event.HouseCreatedEvent;

@Configuration
@EnableKafka
public class KafkaConsumerConfig {

  @Bean
  public ConsumerFactory<String, BookingAlertEvent> consumerFactory(
    @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
    @Value("${spring.kafka.consumer.group-id}") String groupId
  ) {
    Map<String, Object> props = consumerProperties(bootstrapServers, groupId);

    JsonDeserializer<BookingAlertEvent> valueDeserializer = new JsonDeserializer<>(BookingAlertEvent.class);
    valueDeserializer.addTrustedPackages("com.metaarch.alerts.event", "com.slokam.booking.event");
    valueDeserializer.ignoreTypeHeaders();
    valueDeserializer.setUseTypeMapperForKey(false);

    return new DefaultKafkaConsumerFactory<>(
      props,
      new StringDeserializer(),
      new ErrorHandlingDeserializer<>(valueDeserializer));
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, BookingAlertEvent> kafkaListenerContainerFactory(
    ConsumerFactory<String, BookingAlertEvent> consumerFactory
  ) {
    ConcurrentKafkaListenerContainerFactory<String, BookingAlertEvent> factory =
      new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(consumerFactory);
    configureContainer(factory);
    return factory;
  }

  @Bean
  public ConsumerFactory<String, HouseCreatedEvent> houseCreatedConsumerFactory(
    @Value("${spring.kafka.bootstrap-servers}") String bootstrapServers,
    @Value("${spring.kafka.consumer.house-created-group-id}") String groupId
  ) {
    Map<String, Object> props = consumerProperties(bootstrapServers, groupId);

    JsonDeserializer<HouseCreatedEvent> valueDeserializer =
      new JsonDeserializer<>(HouseCreatedEvent.class);
    // The producer and consumer own separate Java event classes. Ignore the
    // producer's type header and deserialize against this service's contract.
    valueDeserializer.ignoreTypeHeaders();

    return new DefaultKafkaConsumerFactory<>(
      props,
      new StringDeserializer(),
      new ErrorHandlingDeserializer<>(valueDeserializer));
  }

  @Bean
  public ConcurrentKafkaListenerContainerFactory<String, HouseCreatedEvent>
      houseCreatedKafkaListenerContainerFactory(
        ConsumerFactory<String, HouseCreatedEvent> houseCreatedConsumerFactory
      ) {
    ConcurrentKafkaListenerContainerFactory<String, HouseCreatedEvent> factory =
      new ConcurrentKafkaListenerContainerFactory<>();
    factory.setConsumerFactory(houseCreatedConsumerFactory);
    configureContainer(factory);
    return factory;
  }

  private Map<String, Object> consumerProperties(String bootstrapServers, String groupId) {
    Map<String, Object> props = new HashMap<>();
    props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
    props.put(ConsumerConfig.GROUP_ID_CONFIG, groupId);
    props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
    props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, JsonDeserializer.class);
    props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
    props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
    return props;
  }

  private <T> void configureContainer(
      ConcurrentKafkaListenerContainerFactory<String, T> factory
  ) {
    factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.RECORD);
    // Retry a failed record three times at two-second intervals before the
    // default recoverer logs and skips the poison record.
    factory.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(2_000L, 3L)));
  }
}
