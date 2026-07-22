using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RewearApi.DAL;
using System;
using System.Threading;
using System.Threading.Tasks;

namespace RewearApi.BackgroundServices
{
    public class DonationRequestExpirationService
        : BackgroundService
    {
        private readonly ILogger<
            DonationRequestExpirationService
        > _logger;

        private readonly TimeSpan _checkInterval =
            TimeSpan.FromHours(1);


        public DonationRequestExpirationService(
            ILogger<
                DonationRequestExpirationService
            > logger
        )
        {
            _logger = logger;
        }


        protected override async Task ExecuteAsync(
            CancellationToken stoppingToken
        )
        {
            _logger.LogInformation(
                "Donation request expiration service started."
            );

            /*
            Run once immediately when the server starts.
            */
            await ExpireRequestsSafely();


            using PeriodicTimer timer =
                new PeriodicTimer(_checkInterval);

            try
            {
                while (
                    await timer.WaitForNextTickAsync(
                        stoppingToken
                    )
                )
                {
                    await ExpireRequestsSafely();
                }
            }
            catch (OperationCanceledException)
            {
                _logger.LogInformation(
                    "Donation request expiration service stopped."
                );
            }
        }


        private Task ExpireRequestsSafely()
        {
            try
            {
                DonationRequestExpirationDAL dal =
                    new DonationRequestExpirationDAL();

                int expiredRequests =
                    dal.ExpireOldDonationRequests();

                if (expiredRequests > 0)
                {
                    _logger.LogInformation(
                        "{ExpiredRequests} donation requests expired.",
                        expiredRequests
                    );
                }
            }
            catch (Exception ex)
            {
                /*
                The server continues running even if one
                expiration check fails.
                */
                _logger.LogError(
                    ex,
                    "Failed to expire old donation requests."
                );
            }

            return Task.CompletedTask;
        }
    }
}