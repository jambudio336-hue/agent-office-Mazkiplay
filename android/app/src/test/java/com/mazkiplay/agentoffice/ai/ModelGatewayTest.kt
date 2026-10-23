package com.mazkiplay.agentoffice.ai

import org.json.JSONObject
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class ModelGatewayTest {
    @Test
    fun freeModelRequiresZeroPromptAndCompletionPricing() {
        assertTrue(ModelGateway.hasZeroPricing(JSONObject("""{"prompt":"0","completion":"0"}""")))
        assertFalse(ModelGateway.hasZeroPricing(JSONObject("""{"prompt":"0","completion":"0.000001"}""")))
        assertFalse(ModelGateway.hasZeroPricing(JSONObject("""{"prompt":"0.001","completion":"0"}""")))
    }

    @Test
    fun missingOrUnparseablePricingIsNotAdvertisedAsFree() {
        assertFalse(ModelGateway.hasZeroPricing(null))
        assertFalse(ModelGateway.hasZeroPricing(JSONObject("""{"prompt":"unknown","completion":"0"}""")))
    }
}
