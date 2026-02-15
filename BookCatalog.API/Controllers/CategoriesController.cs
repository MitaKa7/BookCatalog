using Microsoft.AspNetCore.Mvc;
using BookCatalog.Business.Services;
using BookCatalog.Models.DTOs;

namespace BookCatalog.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly ICategoryService _service;

        public CategoriesController(ICategoryService service)
        {
            _service = service;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryDto>>> Get()
        {
            var categories = await _service.GetAllAsync();
            return Ok(categories);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryDto>> Get(int id)
        {
            var category = await _service.GetByIdAsync(id);
            if (category == null) return NotFound();
            return Ok(category);
        }

        [HttpPost]
        public async Task<IActionResult> Post(CategoryDto categoryDto)
        {
            await _service.AddAsync(categoryDto);
            return CreatedAtAction(nameof(Get), new { id = categoryDto.Id }, categoryDto);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, CategoryDto categoryDto)
        {
            if (id != categoryDto.Id) return BadRequest();
            await _service.UpdateAsync(categoryDto);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
    }
}
