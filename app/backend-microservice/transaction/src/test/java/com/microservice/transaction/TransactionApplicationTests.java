package com.microservice.transaction;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest(properties = {
	"spring.rabbitmq.listener.simple.auto-startup=false"
})
@ActiveProfiles("test")
class TransactionApplicationTests {

	@Test
	void contextLoads() {
	}

}
