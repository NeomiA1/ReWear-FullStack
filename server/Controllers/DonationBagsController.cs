using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using RewearApi.Extensions;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DonationBagsController : ControllerBase
    {
        private readonly DonationBagDAL _donationBagDal =
            new DonationBagDAL();

        private readonly BagMediaDAL _bagMediaDal =
            new BagMediaDAL();

        private readonly IWebHostEnvironment _environment;


        public DonationBagsController(
            IWebHostEnvironment environment
        )
        {
            _environment = environment;
        }


        [HttpPost]
        public ActionResult CreateDonationBag(
            [FromBody] DonationBag bag
        )
        {
            if (bag == null)
            {
                return BadRequest(new
                {
                    message =
                        "DonationBag object is null"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            bag.UserId = currentUserId;

            List<string> errors =
                bag.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                int bagId =
                    _donationBagDal
                        .CreateDonationBag(bag);

                return Ok(new
                {
                    bagId,

                    message =
                        "Donation bag created successfully"
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


        [HttpGet("user/{userId}")]
        public ActionResult GetDonationBagsByUserId(
            int userId,
            [FromQuery] string? size,
            [FromQuery] string? status
        )
        {
            if (userId <= 0)
            {
                return BadRequest(new
                {
                    message =
                        "UserId must be greater than zero"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            if (userId != currentUserId)
            {
                return Forbid();
            }

            if (
                !string.IsNullOrWhiteSpace(status)
                && !DonationBag.IsValidDonationStatus(
                    status
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
                List<DonationBag> bags =
                    _donationBagDal
                        .GetDonationBagsByUserId(
                            currentUserId,
                            size,
                            status
                        );

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


        [HttpPut("{bagId}")]
        public ActionResult UpdateDonationBag(
            int bagId,
            [FromBody] DonationBag bag
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

            if (bag == null)
            {
                return BadRequest(new
                {
                    message =
                        "DonationBag object is null"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            if (
                !_donationBagDal.BelongsToUser(
                    bagId,
                    currentUserId
                )
            )
            {
                return NotFound(new
                {
                    message =
                        "The donation bag was not found."
                });
            }

            bag.BagId = bagId;
            bag.UserId = currentUserId;

            /*
             * הסטטוס אינו משתנה דרך פעולת העריכה.
             * הערך נדרש רק כדי שה-Validation של המודל יעבור.
             */
            if (
                string.IsNullOrWhiteSpace(
                    bag.DonationStatus
                )
            )
            {
                bag.DonationStatus = "Draft";
            }

            List<string> errors =
                bag.Validate();

            if (errors.Any())
            {
                return BadRequest(errors);
            }

            try
            {
                _donationBagDal.UpdateDonationBag(
                    bagId,
                    currentUserId,
                    bag
                );

                return Ok(new
                {
                    bagId,

                    message =
                        "השק עודכן בהצלחה"
                });
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "cannot be edited",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    ex.Message.Contains(
                        "locked",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "לא ניתן לערוך שק שכבר נמצא בתהליך תרומה."
                    });
                }

                if (
                    ex.Message.Contains(
                        "does not exist",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    ex.Message.Contains(
                        "does not belong",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "השק לא נמצא."
                    });
                }

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
                return BadRequest(new
                {
                    message =
                        "BagId must be greater than zero"
                });
            }

            int currentUserId =
                User.GetCurrentUserId();

            if (
                !_donationBagDal.BelongsToUser(
                    bagId,
                    currentUserId
                )
            )
            {
                return NotFound(new
                {
                    message =
                        "The donation bag was not found."
                });
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
                _donationBagDal
                    .UpdateDonationBagStatus(
                        bagId,
                        currentUserId,
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
                if (
                    ex.Message.Contains(
                        "locked after approval",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "The donation is locked after approval and cannot be changed."
                    });
                }

                if (
                    ex.Message.Contains(
                        "does not exist",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "The donation bag does not exist."
                    });
                }

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

            int currentUserId =
                User.GetCurrentUserId();

            if (
                !_donationBagDal.BelongsToUser(
                    bagId,
                    currentUserId
                )
            )
            {
                return NotFound(new
                {
                    message =
                        "The donation bag was not found."
                });
            }

            List<string> fileErrors =
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
                string webRootPath =
                    _environment.WebRootPath
                    ?? Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot"
                    );

                string uploadsFolder =
                    Path.Combine(
                        webRootPath,
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

                try
                {
                    _bagMediaDal.AddBagMedia(media);
                }
                catch
                {
                    if (
                        System.IO.File.Exists(
                            fullFilePath
                        )
                    )
                    {
                        System.IO.File.Delete(
                            fullFilePath
                        );
                    }

                    throw;
                }

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


        [HttpDelete("{bagId}")]
        public ActionResult DeleteDonationBag(
            int bagId
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

            int currentUserId =
                User.GetCurrentUserId();

            if (
                !_donationBagDal.BelongsToUser(
                    bagId,
                    currentUserId
                )
            )
            {
                return NotFound(new
                {
                    message =
                        "The donation bag was not found."
                });
            }

            try
            {
                List<string> mediaUrls =
                    _bagMediaDal
                        .GetMediaUrlsByBagId(bagId);

                _donationBagDal.DeleteDonationBag(
                    bagId,
                    currentUserId
                );

                List<string>
                    filesThatCouldNotBeDeleted =
                        new List<string>();

                string webRootPath =
                    _environment.WebRootPath
                    ?? Path.Combine(
                        Directory.GetCurrentDirectory(),
                        "wwwroot"
                    );

                string allowedUploadsFolder =
                    Path.GetFullPath(
                        Path.Combine(
                            webRootPath,
                            "uploads",
                            "bags"
                        )
                    );

                foreach (string mediaUrl in mediaUrls)
                {
                    try
                    {
                        string relativePath =
                            mediaUrl
                                .TrimStart('/')
                                .Replace(
                                    '/',
                                    Path.DirectorySeparatorChar
                                );

                        string physicalPath =
                            Path.GetFullPath(
                                Path.Combine(
                                    webRootPath,
                                    relativePath
                                )
                            );

                        bool isInsideUploadsFolder =
                            physicalPath.StartsWith(
                                allowedUploadsFolder
                                + Path.DirectorySeparatorChar,
                                StringComparison
                                    .OrdinalIgnoreCase
                            );

                        if (!isInsideUploadsFolder)
                        {
                            filesThatCouldNotBeDeleted
                                .Add(mediaUrl);

                            continue;
                        }

                        if (
                            System.IO.File.Exists(
                                physicalPath
                            )
                        )
                        {
                            System.IO.File.Delete(
                                physicalPath
                            );
                        }
                    }
                    catch
                    {
                        filesThatCouldNotBeDeleted
                            .Add(mediaUrl);
                    }
                }

                if (
                    filesThatCouldNotBeDeleted.Any()
                )
                {
                    return Ok(new
                    {
                        message =
                            "Donation bag was deleted, but some physical files could not be removed.",

                        deletedBagId = bagId,

                        filesThatCouldNotBeDeleted
                    });
                }

                return Ok(new
                {
                    message =
                        "Donation bag and its files were deleted successfully",

                    deletedBagId = bagId
                });
            }
            catch (Exception ex)
            {
                if (
                    ex.Message.Contains(
                        "does not exist or does not belong",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return NotFound(new
                    {
                        message =
                            "The donation bag was not found."
                    });
                }

                if (
                    ex.Message.Contains(
                        "locked after approval",
                        StringComparison.OrdinalIgnoreCase
                    )
                    ||
                    ex.Message.Contains(
                        "active donation bag cannot be deleted",
                        StringComparison.OrdinalIgnoreCase
                    )
                )
                {
                    return Conflict(new
                    {
                        message =
                            "The donation is locked after approval and cannot be deleted."
                    });
                }

                return BadRequest(new
                {
                    message = ex.Message
                });
            }
        }
    }
}