using Microsoft.AspNetCore.Mvc;
using RewearApi.BL;
using RewearApi.DAL;
using System.Linq;

namespace RewearApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DonationBagsController : ControllerBase
    {
        private readonly DonationBagDAL _donationBagDal = new DonationBagDAL();
        private readonly BagMediaDAL _bagMediaDal = new BagMediaDAL();

        [HttpPost]
        public ActionResult CreateDonationBag([FromBody] DonationBag bag)
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

            _donationBagDal.CreateDonationBag(bag);

            return Ok("Donation bag created successfully");
        }

        [HttpGet("user/{userId}")]
        public ActionResult GetDonationBagsByUserId(int userId)
        {
            try
            {
                var bags = _donationBagDal.GetDonationBagsByUserId(userId);
                return Ok(bags);
            }

            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }

        }

        [HttpPost("media")]
        public ActionResult AddBagMedia([FromBody] BagMedia media)
        {
            if (media == null)
            {
                return BadRequest("BagMedia object is null");
            }

            var errors = media.Validate();
            if (errors.Any())
            {
                return BadRequest(errors);
            }

            _bagMediaDal.AddBagMedia(media);

            return Ok("Bag media added successfully");
        }
    }
}