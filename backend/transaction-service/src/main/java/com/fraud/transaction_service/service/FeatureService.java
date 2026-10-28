package com.fraud.transaction_service.service;

import com.fraud.transaction_service.dto.FeatureDTO;
import com.fraud.transaction_service.util.FeatureCalculator;
import com.fraud.transaction_service.entity.CustomerAggDaily;
import com.fraud.transaction_service.repository.CustomerAggDailyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeatureService {

    private final CustomerAggDailyRepository customerAggDailyRepository;

    /*public FeatureDTO buildFeature(Long customerId){
        LocalDate today = LocalDate.now(java.time.ZoneOffset.UTC);
        LocalDate d30 = today.minusDays(30);
        LocalDate d7 = today.minusDays(7);
        LocalDate d14 = today.minusDays(14);


        List<CustomerAggDaily> last30 = customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d30, today);
        List<CustomerAggDaily> last14= customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d14, today);
        List<CustomerAggDaily> last7 = customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d7, today);

        // --------------------------
        // 30d base stats
        // --------------------------
        long txCount30d = FeatureCalculator.sumLong(last30, CustomerAggDaily::getTxCount);

        BigDecimal totalAmount30d =
                FeatureCalculator.sumAmount(last30, CustomerAggDaily::getTotalAmount);

        BigDecimal maxTxnAmount30d =
                FeatureCalculator.maxAmount(last30);

        BigDecimal avgTxnAmount30d =
                (txCount30d == 0) ? BigDecimal.ZERO
                        : totalAmount30d.divide(BigDecimal.valueOf(txCount30d), 4, RoundingMode.HALF_UP);

        BigDecimal amountStddev30d =
                FeatureCalculator.stdDev(last30, avgTxnAmount30d);

        // --------------------------
        // velocities (7d vs prev7d)
        // --------------------------
        BigDecimal spendLast7 =
                FeatureCalculator.sumAmount(last7, CustomerAggDaily::getTotalAmount);

        BigDecimal spendPrev7 =
                FeatureCalculator.sumAmount(last14, CustomerAggDaily::getTotalAmount);

        double spendVelocity7dVsPrev7d =
                FeatureCalculator.velocity(spendLast7, spendPrev7);

        long txLast7 =
                FeatureCalculator.sumLong(last7, CustomerAggDaily::getTxCount);

        long txPrev7 =
                FeatureCalculator.sumLong(last14, CustomerAggDaily::getTxCount);

        double txVelocity7dVsPrev7d =
                FeatureCalculator.ratio(txLast7, txPrev7);

        // --------------------------
        // decline ratio + decline trend
        // --------------------------
        long decline30 =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getDeclineCount);

        double declineRatio30d =
                FeatureCalculator.ratio(decline30, txCount30d);

        long declineLast7 =
                FeatureCalculator.sumLong(last7, CustomerAggDaily::getDeclineCount);

        long declinePrev7 =
                FeatureCalculator.sumLong(last14, CustomerAggDaily::getDeclineCount);

        double declineTrend7dVsPrev7d =
                FeatureCalculator.ratio(declineLast7, declinePrev7);

        // --------------------------
        // channel ratios
        // --------------------------
        long ecom30 = FeatureCalculator.sumLong(last30, CustomerAggDaily::getEcomCount);
        long pos30  = FeatureCalculator.sumLong(last30, CustomerAggDaily::getPosCount);
        long atm30  = FeatureCalculator.sumLong(last30, CustomerAggDaily::getAtmCount);

        double ecomRatio30d = FeatureCalculator.ratio(ecom30, txCount30d);
        double posRatio30d  = FeatureCalculator.ratio(pos30, txCount30d);
        double atmRatio30d  = FeatureCalculator.ratio(atm30, txCount30d);

        // --------------------------
        // merchant
        // --------------------------
        long uniqueMerchantCount30d =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getUniqueMerchantCount);

        long riskyMerchantCount30d =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getRiskyMerchantCount);

        // --------------------------
        // MCC (NOT AVAILABLE in your daily table yet)
        // Return 0 for now until you add MCC aggregates.
        // --------------------------
        long uniqueMccCount30d = 0L;
        double highRiskMccRatio30d = 0.0;

        // --------------------------
        // new device/country flag using counts (since you don't store boolean flags)
        // --------------------------
        long maxDeviceLast7 = last7.stream()
                .mapToLong(CustomerAggDaily::getUniqueDeviceCount).max().orElse(0);

        long maxDevicePrev7 = last14.stream()
                .mapToLong(CustomerAggDaily::getUniqueDeviceCount).max().orElse(0);

        boolean newDeviceFlagRecent = maxDeviceLast7 > maxDevicePrev7;

        long maxCountryLast7 = last7.stream()
                .mapToLong(CustomerAggDaily::getUniqueCountryCount).max().orElse(0);

        long maxCountryPrev7 = last14.stream()
                .mapToLong(CustomerAggDaily::getUniqueCountryCount).max().orElse(0);

        boolean newCountryFlagRecent = maxCountryLast7 > maxCountryPrev7;

        return FeatureDTO.builder()
                .customerId(customerId)

                .txCount30d(txCount30d)
                .totalAmount30d(totalAmount30d)
                .avgTxnAmount30d(avgTxnAmount30d)
                .maxTxnAmount30d(maxTxnAmount30d)
                .amountStddev30d(amountStddev30d)

                .spendVelocity7dVsPrev7d(spendVelocity7dVsPrev7d)
                .txVelocity7dVsPrev7d(txVelocity7dVsPrev7d)

                .declineRatio30d(declineRatio30d)
                .declineTrend7dVsPrev7d(declineTrend7dVsPrev7d)

                .ecomRatio30d(ecomRatio30d)
                .posRatio30d(posRatio30d)
                .atmRatio30d(atmRatio30d)

                .uniqueMerchantCount30d(uniqueMerchantCount30d)
                .riskyMerchantCount30d(riskyMerchantCount30d)

                .uniqueMccCount30d(uniqueMccCount30d)
                .highRiskMccRatio30d(highRiskMccRatio30d)

                .newDeviceFlagRecent(newDeviceFlagRecent)
                .newCountryFlagRecent(newCountryFlagRecent)
                .build();

    }*/

    public FeatureDTO buildFeature(Long customerId) {

        LocalDate today = LocalDate.now(java.time.ZoneOffset.UTC);
        LocalDate d30 = today.minusDays(30);
        LocalDate d7 = today.minusDays(7);
        LocalDate d14 = today.minusDays(14);

        List<CustomerAggDaily> last30 =
                customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d30, today);

        List<CustomerAggDaily> last7 =
                customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d7, today);

        List<CustomerAggDaily> prev7 =
                customerAggDailyRepository.findByCustomerIdAndAggDateBetween(customerId, d14, d7.minusDays(1));

        long txCount30d =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getTxCount);

        BigDecimal totalAmount30d =
                FeatureCalculator.sumAmount(last30, CustomerAggDaily::getTotalAmount);

        BigDecimal maxTxnAmount30d =
                FeatureCalculator.maxAmount(last30);

        BigDecimal avgTxnAmount30d =
                txCount30d == 0
                        ? BigDecimal.ZERO
                        : totalAmount30d.divide(BigDecimal.valueOf(txCount30d), 4, RoundingMode.HALF_UP);

        BigDecimal amountStddev30d =
                FeatureCalculator.stdDev(last30, avgTxnAmount30d);

        BigDecimal spendLast7 =
                FeatureCalculator.sumAmount(last7, CustomerAggDaily::getTotalAmount);

        BigDecimal spendPrev7 =
                FeatureCalculator.sumAmount(prev7, CustomerAggDaily::getTotalAmount);

        double spendVelocity7dVsPrev7d =
                spendPrev7.compareTo(BigDecimal.ZERO) == 0
                        ? (spendLast7.compareTo(BigDecimal.valueOf(100000)) > 0 ? 4.2 : 1.0)
                        : FeatureCalculator.velocity(spendLast7, spendPrev7);

        long txLast7 =
                FeatureCalculator.sumLong(last7, CustomerAggDaily::getTxCount);

        long txPrev7 =
                FeatureCalculator.sumLong(prev7, CustomerAggDaily::getTxCount);

        double txVelocity7dVsPrev7d =
                txPrev7 == 0
                        ? (txLast7 > 3 ? 3.0 : 1.0)
                        : FeatureCalculator.ratio(txLast7, txPrev7);

        long ecom30 =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getEcomCount);

        long pos30 =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getPosCount);

        long atm30 =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getAtmCount);

        double ecomRatio30d =
                FeatureCalculator.ratio(ecom30, txCount30d);

        double posRatio30d =
                FeatureCalculator.ratio(pos30, txCount30d);

        double atmRatio30d =
                FeatureCalculator.ratio(atm30, txCount30d);

        long uniqueMerchantCount30d =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getUniqueMerchantCount);

        long riskyMerchantCount30d =
                FeatureCalculator.sumLong(last30, CustomerAggDaily::getRiskyMerchantCount);

        long maxDeviceLast7 = last7.stream()
                .mapToLong(CustomerAggDaily::getUniqueDeviceCount)
                .max()
                .orElse(0);

        long maxDevicePrev7 = prev7.stream()
                .mapToLong(CustomerAggDaily::getUniqueDeviceCount)
                .max()
                .orElse(0);

        boolean newDeviceFlagRecent =
                maxDeviceLast7 > 1 || (maxDevicePrev7 > 0 && maxDeviceLast7 > maxDevicePrev7);

        long maxCountryLast7 = last7.stream()
                .mapToLong(CustomerAggDaily::getUniqueCountryCount)
                .max()
                .orElse(0);

        long maxCountryPrev7 = prev7.stream()
                .mapToLong(CustomerAggDaily::getUniqueCountryCount)
                .max()
                .orElse(0);

        boolean newCountryFlagRecent =
                maxCountryLast7 > 1 || (maxCountryPrev7 > 0 && maxCountryLast7 > maxCountryPrev7);

        return FeatureDTO.builder()
                .txCount30d(txCount30d)
                .totalAmount30d(totalAmount30d)
                .avgTxnAmount30d(avgTxnAmount30d)
                .maxTxnAmount30d(maxTxnAmount30d)
                .amountStddev30d(amountStddev30d)

                .spendVelocity7dVsPrev7d(spendVelocity7dVsPrev7d)
                .txVelocity7dVsPrev7d(txVelocity7dVsPrev7d)

                .ecomRatio30d(ecomRatio30d)
                .posRatio30d(posRatio30d)
                .atmRatio30d(atmRatio30d)

                .uniqueMerchantCount30d(uniqueMerchantCount30d)
                .riskyMerchantCount30d(riskyMerchantCount30d)

                .newDeviceFlagRecent(newDeviceFlagRecent)
                .newCountryFlagRecent(newCountryFlagRecent)
                .build();
    }
}


