using BookCatalog.Data.Repositories;
using BookCatalog.Models.DTOs;
using BookCatalog.Models.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BookCatalog.Business.Services
{
    public class CategoryService : ICategoryService
    {
        private readonly ICategoryRepository _repository;

        public CategoryService(ICategoryRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<CategoryDto>> GetAllAsync()
        {
            var categories = await _repository.GetAllAsync();
            return categories.Select(c => new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            });
        }

        public async Task<CategoryDto> GetByIdAsync(int id)
        {
            var c = await _repository.GetByIdAsync(id);
            if (c == null) return null;
            return new CategoryDto
            {
                Id = c.Id,
                Name = c.Name
            };
        }

        public async Task AddAsync(CategoryDto categoryDto)
        {
            var category = new Category
            {
                Name = categoryDto.Name
            };
            await _repository.AddAsync(category);
        }

        public async Task UpdateAsync(CategoryDto categoryDto)
        {
            var category = await _repository.GetByIdAsync(categoryDto.Id);
            if (category == null) return;

            category.Name = categoryDto.Name;

            await _repository.UpdateAsync(category);
        }

        public async Task DeleteAsync(int id)
        {
            await _repository.DeleteAsync(id);
        }
    }
}
