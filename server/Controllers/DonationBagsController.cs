using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

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
                return BadRequest(
                    "DonationBag object is null"
                );
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
                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }


        [HttpGet("user/{userId}")]
        public ActionResult GetDonationBagsByUserId(
            int userId
        )
        {
            if (userId <= 0)
            {
                return BadRequest(
                    "UserId must be greater than zero"
                );
            }

            try
            {
                var bags =
                    _donationBagDal
                        .GetDonationBagsByUserId(userId);

                return Ok(bags);
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message
                });
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
                    message =
                        "Invalid donation bag status",

                    allowedStatuses =
                        DonationBag
                            .AllowedDonationStatuses
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
                    bagId,
                    donationStatus =
                        request.DonationStatus,

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


        [HttpPost("{bagId}/media")]
        [RequestSizeLimit(300L * 1024L * 1024L)]
        public async Task<ActionResult> UploadBagMedia(
            int bagId,
            [FromForm] IFormFile file,
            [FromForm] string? mediaDescription
        )
        {
            if (bagId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "BagId must be greater than zero"
                });
            }

            var fileErrors =
                BagMedia.ValidateUploadedFile(file);

            if (fileErrors.Any())
            {
                return BadRequest(new
                {
                    message =
                        "The uploaded file is invalid",

                    errors = fileErrors
                });
            }

            try
            {
                string uploadsFolder =
                    Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot",
                        "uploads",
                        "bags"
                    );

                if (!Directory.Exists(uploadsFolder))
                {
                    Directory.CreateDirectory(
                        uploadsFolder
                    );
                }

                string extension =
                    Path.GetExtension(file.FileName)
                        .ToLowerInvariant();

                string storedFileName =
                    $"{Guid.NewGuid()}{extension}";

                string fullFilePath =
                    Path.Combine(
                        uploadsFolder,
                        storedFileName
                    );

                await using (
                    FileStream stream =
                        new FileStream(
                            fullFilePath,
                            FileMode.Create
                        )
                )
                {
                    await file.CopyToAsync(stream);
                }

                string mediaUrl =
                    $"/uploads/bags/{storedFileName}";

                BagMedia media =
                    new BagMedia
                    {
                        BagId = bagId,

                        MediaType =
                            BagMedia.GetMediaType(file),

                        MediaUrl = mediaUrl,

                        MediaDescription =
                            mediaDescription
                    };

                _bagMediaDal.AddBagMedia(media);

                string absoluteMediaUrl =
                    $"{Request.Scheme}://" +
                    $"{Request.Host}" +
                    mediaUrl;

                return Ok(new
                {
                    message =
                        "Bag media uploaded successfully",

                    mediaUrl =
                        absoluteMediaUrl,

                    mediaType =
                        media.MediaType,

                    originalFileName =
                        file.FileName,

                    fileSize =
                        file.Length
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
    }
}