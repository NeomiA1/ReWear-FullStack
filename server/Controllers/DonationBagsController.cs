using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonationBagsController : ControllerBase
    {
        private readonly DonationBagDAL _donationBagDal =
            new DonationBagDAL();

        private readonly BagMediaDAL _bagMediaDal =
            new BagMediaDAL();


        [HttpPost]
        public ActionResult CreateDonationBag(
            [FromBody] DonationBag bag
        )
        {
            if (bag == null)
            {
                return BadRequest("DonationBag object is null");
            }

            var errors = bag.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                _donationBagDal.CreateDonationBag(bag);

                return Ok(
                    "Donation bag created successfully"
                );
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpGet("user/{userId}")]
        public ActionResult GetDonationBagsByUserId(int userId)
        {
            try
            {
                var bags =
                    _donationBagDal
                        .GetDonationBagsByUserId(userId);

                return Ok(bags);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


       [HttpPatch("{bagId}/status")]
public ActionResult UpdateDonationBagStatus(
    int bagId,
    [FromBody] DonationBagStatusUpdate request
)
{
    if (bagId <= 0)
    {
        return BadRequest(
            "BagId must be greater than zero"
        );
    }

    if (
        request == null
        || !DonationBag.IsValidDonationStatus(
            request.DonationStatus
        )
    )
    {
        return BadRequest(new
        {
            message = "Invalid donation bag status",

            allowedStatuses =
                DonationBag.AllowedDonationStatuses
        });
    }

    try
    {
        _donationBagDal.UpdateDonationBagStatus(
            bagId,
            request.DonationStatus!
        );

        return Ok(new
        {
            bagId = bagId,

            donationStatus = request.DonationStatus,

            message =
                "Donation bag status updated successfully"
        });
    }
    catch (Exception ex)
    {
        return BadRequest(new
        {
            message = ex.Message
        });
    }
}

        [HttpPost("media")]
        public ActionResult AddBagMedia(
            [FromBody] BagMedia media
        )
        {
            if (media == null)
            {
                return BadRequest(
                    "BagMedia object is null"
                );
            }

            var errors = media.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                _bagMediaDal.AddBagMedia(media);

                return Ok(
                    "Bag media added successfully"
                );
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}