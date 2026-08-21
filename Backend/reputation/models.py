from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class ProfessionalReview(models.Model):
    booking = models.OneToOneField(
        "marketplace.BookingRequest",
        on_delete=models.PROTECT,
        related_name="professional_review",
    )
    client = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.PROTECT,
        related_name="professional_reviews_written",
    )
    professional = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.PROTECT,
        related_name="completed_work_reviews",
    )
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.CharField(max_length=1000, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["professional", "created_at"], name="rep_prof_time_idx"),
            models.Index(fields=["professional", "rating"], name="rep_prof_rating_idx"),
        ]

    def __str__(self):
        return f"{self.booking_id} — {self.rating}/5"
